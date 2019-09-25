const gulp = require('gulp')
const babel = require('gulp-babel')
const sass = require('gulp-sass')
const rename = require('gulp-rename') // dirname,basename,prefix,suffix,extname
const cleanCSS = require('gulp-clean-css')
const uglify = require('gulp-uglify')
const server = require('browser-sync').create() // inbuilt
const browserify = require('browserify')
const source = require('vinyl-source-stream')
const cache = require('gulp-cached') // name of cache
const es = require('event-stream')
const buffer = require('vinyl-buffer')
const htmlmin = require('gulp-htmlmin')
const autoprefixer = require('gulp-autoprefixer')
const imgmin = require('gulp-imagemin')
const newer = require('gulp-newer') // process new (images) only - imagemin
const del = require('del') // explicity ignore parent dir for /**/
const sourcemaps = require('gulp-sourcemaps')
// const concat = require('gulp-concat');
// const changed = require('gulp-changed'); // changed(dest)
// const remember = require('gulp-remember');

const paths = {
  scss: {
    src: 'src/scss/**/*.scss',
    dest: 'dist/css',
    min: 'dist-min/css'
  },
  js: {
    src: 'src/js/**/*.js',
    dest: 'dist/js',
    min: 'dist-min/js/min'
  },
  brw: {
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
  img: {
    src: 'src/**/*.+(jpg|png|JPG|jpeg)',
    dest: 'dist',
    min: 'dist-min'
  },
  base: 'dist-min'
}

const prefixerOptions = {
  browsers: ['last 2 versions']
}

// del
gulp.task('del', () => {
  del(['dist-min', 'dist'])
    .then(paths => {
      console.log('deleted: \n', paths.join('\n'))
    })
})

// img
gulp.task('img', function () {
  return gulp.src(paths.img.src)
    .pipe(newer(paths.img.dest))
    .pipe(gulp.dest(paths.img.dest))
    .pipe(imgmin())
    .pipe(gulp.dest(paths.img.min))
    .pipe(server.reload({
      stream: true
    }))
})

// js
gulp.task('brw-js', function () {
  const files = [paths.brw.main, paths.brw.sw]

  let tasks = files.map(function (entry) {
    return browserify({ entries: [entry] })
      .bundle()
      .pipe(source(entry))
      .pipe(buffer())
      .pipe(sourcemaps.init({loadMaps: true}))
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
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(paths.brw.min))
  })
  return es.merge.apply(null, tasks)
})

// html
gulp.task('html', function () {
  return gulp.src(paths.html.src)
    .pipe(cache('html'))
    .pipe(gulp.dest(paths.html.dest))
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest(paths.html.min))
    .pipe(server.reload({
      stream: true
    }))
})

// scss
gulp.task('scss', function () {
  return gulp.src(paths.scss.src)
    .pipe(sourcemaps.init())
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
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(paths.scss.min))
})

gulp.task('default', ['html', 'scss', 'brw-js', 'img'])
gulp.task('build', ['html', 'scss', 'brw-js', 'img'])

gulp.task('serve', function () {
  server.init({
    server: {
      baseDir: paths.base
    }
  })
})

gulp.task('serve-watch', ['build', 'serve'], function () {
  gulp.watch(paths.scss.src, ['scss'])
  gulp.watch(paths.js.src, ['brw-js'])
  gulp.watch(paths.html.src, ['html'])
  gulp.watch(paths.img.src, ['img'])
})

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
