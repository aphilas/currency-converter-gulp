let gulp = require('gulp');
let babel = require('gulp-babel');
let sass = require('gulp-sass');
let rename = require('gulp-rename'); //dirname,basename,prefix,suffix,extname
let cleanCSS = require('gulp-clean-css');
let uglify = require('gulp-uglify');
let server = require('browser-sync').create(); // inbuilt
let browserify = require('browserify');
let source = require('vinyl-source-stream');
let cache = require('gulp-cached'); // name of cache
let es = require('event-stream');
let buffer = require('vinyl-buffer');
let htmlmin = require('gulp-htmlmin');
let autoprefixer = require('gulp-autoprefixer');
// let concat = require('gulp-concat');
// let changed = require('gulp-changed'); // changed(dest)
// let newer = require('gulp-newer'); // process new (images) only - imagemin
// let remember = require('gulp-remember');

const paths = {
  scss: {
    src: 'src/scss/**/*.scss',
    dest: 'dist/css',
    min: 'dist-min/css'
  },
  js: {
    src: 'src/js/**/*.js',
    dest: 'dist/js',
    min: 'dist-min/js/min',
  },
  brw:{
    main: 'src/js/main.js',
    sw: 'src/js/sw/sw.js',
    dest: 'dist',
    min: 'dist-min'
  },
  html: {
    src: 'src/**/*.html',
    dest: 'dist',
    min: 'dist-min'
  },
  base: 'dist-min'
};

const prefixerOptions = {
  browsers: ['last 2 versions']
};

// js
gulp.task('brw-js', function(){

  const files = [paths.brw.main, paths.brw.sw];

  let tasks = files.map(function(entry) {
    return browserify({ entries: [entry] })
      .bundle()
      .pipe(source(entry))
      .pipe(buffer())
      .pipe(cache('js'))
      .pipe(babel())
      .pipe(rename({
          suffix: '-bundle',
          dirname: 'js' 
      }))
      .pipe(gulp.dest(paths.brw.dest))
      .pipe(server.reload({
        stream: true
      }))
      .pipe(uglify())
      .pipe(rename({
        suffix: '.min'
      }))
      .pipe(gulp.dest(paths.brw.min));
      });
  return es.merge.apply(null, tasks);
});

// html
gulp.task('html', function(){
  return gulp.src(paths.html.src)
    .pipe(cache('html'))
    .pipe(gulp.dest(paths.html.dest))
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest(paths.html.min))
    .pipe(server.reload({
      stream: true
    }));
});

// scss
gulp.task('scss', function(){
  return gulp.src(paths.scss.src)
    .pipe(cache('scss'))
    .pipe(sass())
    .pipe(autoprefixer(prefixerOptions))
    .pipe(gulp.dest(paths.scss.dest))
    .pipe(server.reload({
      stream: true
    }))
    .pipe(cleanCSS())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest(paths.scss.min));
});

gulp.task('default', ['html', 'scss', 'brw-js', 'watch']);
gulp.task('build', ['html', 'scss', 'brw-js']);

gulp.task('serve', function() {
  server.init({
    server: {
      baseDir: paths.base
    },
  })
})

gulp.task('serve-watch', ['build','serve'], function(){
  gulp.watch(paths.scss.src, ['scss']);
  gulp.watch(paths.js.src, ['brw-js']);
  gulp.watch(paths.html.src, ['html']);
});

// gulp-rename
// gulp-uglify
// gulp-minify
// gulp-sass
// gulp-rename
// gulp-prettier
// gulp-concat
// gulp-clean-css
// gulp-changed
// browser-sync
// babel-core
// babel-preset-env
// gulp-babel
//
// gulp-remember
// gulp-cached
// gulp-newer

// gulp.task('js', function(){
//   return gulp.src(paths.js.src)
//     .pipe(cache('js'))
//     .pipe(babel())
//     .pipe(gulp.dest(paths.js.dest))
//     .pipe(uglify())
//     .pipe(rename({
//       suffix: '.min'
//     }))
//     .pipe(gulp.dest(paths.js.min))
//     .pipe(server.reload({
//       stream: true
//     }));
// });

// gulp.task('brw', function(){
//   return browserify({
//       entries: paths.brw.src,
//       debug: true
//     })
//     .bundle()
//     .pipe(source('bundle.js'))
//     //.pipe(buffer())
//     .pipe(gulp.dest(paths.brw.dest));
// });