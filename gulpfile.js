// // 实现这个项目的构建任务
const {src, dest, watch, series, parallel} = require('gulp');
const path = require('path');
const cwd = process.cwd();

const del = require('del')
const browserSync = require('browser-sync');

const loadPlugins = require('gulp-load-plugins');

const plugins = loadPlugins()

const bs = browserSync.create();

// 若项目没有配置文件 则读取默认配置
let config = {
  build: {
    src: 'src',
    dist: 'dist',
    temp: 'temp',
    public: 'public',
    paths: {
      styles: 'assets/styles/*.scss',
      scripts: 'assets/scripts/*.js',
      pages: '*.html',
      images: 'assets/images/**',
      fonts: 'assets/fonts/**',
    }
  }
};

const data = {
  menus: [
    {
      name: 'Home',
      icon: 'aperture',
      link: 'index.html'
    },
    {
      name: 'Features',
      link: 'features.html'
    },
    {
      name: 'About',
      link: 'about.html'
    },
    {
      name: 'Contact',
      link: '#',
      children: [
        {
          name: 'Twitter',
          link: 'https://twitter.com/w_zce'
        },
        {
          name: 'About',
          link: 'https://weibo.com/zceme'
        },
        {
          name: 'divider'
        },
        {
          name: 'About',
          link: 'https://github.com/zce'
        }
      ]
    }
  ],
  pkg: require('./package.json'),
  date: new Date()
}

try {
  const loadConfig = path.join(cwd, './page.config.js');
  config = Object.assign({}, config, loadConfig);
} catch (error) {
  console.log(error);
}

const styles = () => {
  return src(config.build.paths.styles, {base: config.build.src, cwd: config.build.src})
    .pipe(plugins.sass({outputStyle:'expended'}))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({ stream: true }))
}

const scripts = () => {
  return src(config.build.paths.scripts, {base: config.build.src, cwd: config.build.src})
    .pipe(plugins.babel({
      presets: [require('@babel/preset-env')]
    }))
    .pipe(dest(config.build.temp))
    .pipe(bs.reload({stream: true}))
}

const pages = () => {
  return src(config.build.paths.pages, {base: config.build.src, cwd: config.build.src})
  .pipe(plugins.swig({data, defaults: { cache: false } }))
  .pipe(dest(config.build.temp))
}

const images = () => {
  return src(config.build.paths.images, {base: config.build.src, cwd: config.build.src})
  .pipe(plugins.imagemin())
  .pipe(dest(config.build.dist))
}


const fonts = () => {
  return src(config.build.paths.fonts, {base: config.build.src, cwd: config.build.src})
  .pipe(plugins.imagemin())
  .pipe(dest(config.build.dist))
}

const extra = () => {
  return src('**', {base: config.build.public, cwd: config.build.public})
    .pipe(dest(config.build.dist))
}

const clean = () => {
  return del([config.build.dist, config.build.temp])
}

const serveBS = () => {
  watch(config.build.paths.styles, {cwd: config.build.src},  styles);
  watch(config.build.paths.scripts, {cwd: config.build.src}, scripts);
  watch(config.build.paths.pages, {cwd: config.build.src},  pages);
  watch([config.build.paths.images, config.build.paths.fonts], {cwd: config.build.src}, bs.reload);
  watch(["**"], {cwd: config.build.public}, bs.reload);


  bs.init({
    notify: false,
    port: 2080,
    debugInfo:false,
    // logSnippet: false,
    serve: {
      baseDir: [config.build.temp, config.build.src, config.build.public],
      index: config.build.temp+ 'index.html',
      routes: {
        '/node_modules': 'node_modules',
      }
    }
  })

}

const elintJs = () => {
  return src(config.build.paths.scripts, {base: config.build.src, cwd: config.build.src})
    .pipe(plugins.eslint())
    .pipe(plugins.eslint.failOnError());
}

const sassLintFile = () => {
  return src(config.build.paths.styles, {base: config.build.src, cwd: config.build.src})
  .pipe(plugins.sassLint({
    options: {
      formatter: 'stylish',
      'merge-default-rules': false
    },
    files: {include: '**/*.scss', ignore: '/node_module/**/*.scss'},
    rules: {
      'no-ids': 1,
      'no-mergeable-selectors': 0
    },
    configFile: '.sass-lint.yml'
  }))
  .pipe(plugins.sassLint.format())
  .pipe(plugins.sassLint.failOnError())
}

const useref = () => {
  // 为什么用cwd 路径之后无法压缩css 和 js
  return src(config.build.temp + '/' + config.build.paths.pages, { base: config.build.temp })
    .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))
    // html js css
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true
    })))
    .pipe(dest(config.build.dist))
}

const deployFile =  () => {
  return src('**/*',  { base: config.build.dist, cwd: config.build.dist })
    .pipe(plugins.ghPages())
}

const production = (done) => {
  process.env.NODE_ENV = 'production';
  done();
}

const development = (done) => {
  process.env.NODE_ENV = 'development';
  done();
}

const compile = parallel(styles, pages, scripts);

const start = series(production, compile, serveBS);

const serve = series(compile, serveBS)

const build = series(clean, parallel(series(compile, useref), extra, images, fonts));

const lint = parallel(elintJs, sassLintFile);

const deploy = series(build, deployFile);

module.exports = {
  clean,
  build,
  serve,
  lint,
  start,
  deploy
}
