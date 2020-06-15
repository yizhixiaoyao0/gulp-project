
const loadGruntTasks = require('load-grunt-tasks');
const mozjpeg = require('imagemin-mozjpeg');

module.exports = grunt => {

  grunt.initConfig({
    clean: {
      build: 'build/**/*',
    },
    sass: {
      main: {
        files: [{
          expand: true,
          cwd: 'src/assets/styles/',
          src: ['*.scss'],
          dest: 'build/temp/assets/styles',
          ext: '.css'
        }]
      }
    },
    cssmin: {
      target: {
        files: [{
          expand: true,
          cwd: 'build/temp/assets/styles',
          src: ['*.css', '!*.min.css'],
          dest: 'build/dist/assets/styles',
          ext: '.css'
        }]
      }
    },
    babel: {
      options: {
        sourceMap: true,
        presets: ['@babel/preset-env']
      },
      main: {
        files: [{
          expand: true,
          cwd: 'src/assets/scripts/',
          src: ['*.js'],
          dest: 'build/temp/assets/scripts/',
          ext: '.js'
        }]
      }
    },
    uglify: {
      main: {
        files: [{
          expand: true,
          cwd: 'build/temp/assets/scripts/',
          src: ['*.js'],
          dest: 'build/dist/assets/scripts/',
          ext: '.js'
        }]
      }
    },
    swigtemplates: {
      options: {
        defaultContext: {
          pageTitle: 'My Title'
        },
        templatesDir: 'src/'
      },
      dev: {
        context: {
          pageTitle: 'My Title (staging)'
        },
        dest: 'build/temp',
        src: ['src/*.html'],
      },
    },
    imagemin: {
      dynamic: {
        options: {
          optimizationLevel: 3,
          svgoPlugins: [{ removeViewBox: false }],
          use: [mozjpeg()]
        },
        files: [{
          expand: true,
          cwd: 'src/assets/images/',
          src: ['**/*'],
          dest: 'build/dist/assets/images/'
        }, {
          expand: true,
          cwd: 'src/assets/fonts/',
          src: ['**/*'],
          dest: 'build/dist/assets/fonts/'
        }]
      }
    },
    useminPrepare: {
      html: ['build/temp/*.html'],
      options: {
        dest: 'build/dist/',
        flow: {
          html: {
            steps: {
              js: ['uglify'],
              css: ['cssmin']
            },
            post: {}
          }
        }
      }
    },
    usemin: {
      html: ['build/dist/*.html'],
      options: {
        assetsDirs: ['build/dist/assets/scripts/','build/dist/assets/styles/']
      }
    },
    copy: {
      html: {
        expand: true,                   // 需要该参数
        cwd: 'build/temp/',
        src: ['*.html'],         // 会把tpl文件夹+文件复制过去
        dest: 'build/dist/'
      }
    },
    // 检测改变，自动跑sass任务
    watch: {
      css: {
        files: ['src/assets/styles/*.scss'],
        tasks: ['sass'],
        options: {
          spawn: false
        }
      },
      js: {
        files: ['src/assets/scripts/*.js'],
        tasks: ['babel'],
        options: {
          spawn: false
        }
      },
      page: {
        files: ['src/*.html'],
        tasks: ['swigtemplates'],
        options: {
          spawn: false
        }
      },
      img: {
        files: ['src/assets/image/**/*', 'src/assets/fonts/**/*'],
        tasks: ['swigtemplates'],
        options: {
          spawn: false
        }
      }
    }
  })

  loadGruntTasks(grunt);
  grunt.registerTask('default', ['clean', 'sass', 'babel', 'swigtemplates', 'imagemin', 'watch'])
  grunt.registerTask('build', ['clean', 'sass', 'babel', 'swigtemplates', 'imagemin',
  'useminPrepare','copy', 'uglify:main', 'cssmin', 'usemin'])
}