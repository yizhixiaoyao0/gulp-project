
const loadGruntTasks = require('load-grunt-tasks');
const mozjpeg = require('imagemin-mozjpeg');
const browserSync = require('browser-sync');
const bs = browserSync.create();



module.exports = grunt => {
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
      options: {
        mangle: true
      },
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
    htmlmin: {                                     // Task
      dist: {                                      // Target
        options: {                                 // Target options
          removeComments: true,
          collapseWhitespace: true
        },
        files: [{                                   // Dictionary of files
          expand: true,
          cwd: 'build/temp/',
          src: ['*.html'],
          dest: 'build/dist/'
        }]
      }
    },
    useminPrepare: {
      html: ['build/temp/index.html'],
      options: {
        dest: 'build/dist/',
        flow: {
          steps: {
            js: ['uglify'], css: ['cssmin']
          },
          post: {
            js: [{
              name: 'uglify:generated',
              createConfig: function (context, block) {
                console.log(context, 'context')
                var generated = context.options.generated;
                let files = [];
                generated.files.map(item => {
                  let src = [];
                  item.src.map(path => {
                    src.push(path.replace(/build\\temp\\node_modules/g, 'node_modules'));
                  })
                  item.src = src;
                  files.push(item)
                })
                generated.files = files
              }
            }]
          }
        }
      }
    },
    usemin: {
      html: ['build/dist/*.html'],
      options: {
        assetsDirs: ['build/dist/', 'build/dist/assets/scripts/', 'build/dist/assets/styles/']
      }
    },
    copy: {
      public: {
        expand: true,                   // 需要该参数
        cwd: 'public/',
        src: ['**/*'],         // 会把tpl文件夹+文件复制过去
        dest: 'build/dist/public'
      }
    },
    // lint
    sasslint: {
      options: {
        configFile: '.sass-lint.yml',
      },
      target: ['src/assets/styles/**/*.scss']
    },
    eslint: {
      options: {
        configFile: '.eslintrc',
      },
      target: ['src/assets/scripts/**/*.js']
    },
    // gh-page
    ghPages: {
      options: {
        base: 'build/dist'
      },
      src: '**/*'
    },
    browserSync: {
      dev: {
        bsFiles: {
          src: ['**/*'],
        },
        options: {
          port: 8080,
          watchTask: true,
          serve: {
            baseDir: ['build/temp', 'src', 'public'],
            routes: {
              '/node_modules': 'node_modules',
            }
          }
        }
      }
    },
    // 检测改变，自动跑sass任务
    watch: {
      css: {
        files: ['src/assets/styles/*.scss'],
        tasks: ['sass', bs.reload],
        options: {
          spawn: false
        }
      },
      js: {
        files: ['src/assets/scripts/*.js'],
        tasks: ['babel', bs.reload],
        options: {
          spawn: false
        }
      },
      page: {
        files: ['src/*.html'],
        tasks: ['swigtemplates', bs.reload],
        options: {
          spawn: false
        }
      },
      img: {
        files: ['src/assets/image/**/*', 'src/assets/fonts/**/*'],
        tasks: ['swigtemplates', bs.reload],
        options: {
          spawn: false
        }
      }
    }
  })


  grunt.registerTask('production', () => {
    process.env.NODE_ENV = 'production';
  })

  grunt.registerTask('development', () => {
    process.env.NODE_ENV = 'development';
  })


  loadGruntTasks(grunt);

  grunt.registerTask('compile', ['clean', 'sass', 'babel', 'swigtemplates', 'imagemin', 'copy'])

  grunt.registerTask('start', ['production', 'compile', 'browserSync', 'watch']);

  grunt.registerTask('build', ['compile', 'useminPrepare', 'htmlmin', 'uglify', 'cssmin', 'usemin']);

  grunt.registerTask('serve', ['development', 'compile', 'browserSync', 'watch']);

  grunt.registerTask('lint', ['eslint', 'sasslint']);

  grunt.registerTask('deploy', ['ghPages']);


}