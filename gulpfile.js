const {src, dest, watch, series} = require('gulp')
const sass = require('gulp-sass')(require('sass'))
// const purgecss = require('gulp-purgecss')

function bulidStyles() {
  return src('scss/**/*.scss')
    .pipe(sass())
    // .pipe(purgecss({content: ['*.html'],
    //   safelist: {
    //     standard: [/top$/, /bottom$/]
    //   }
    // }))
    .pipe(dest('css'))
}

function watchTask() {
  watch(['scss/**/*.scss'], bulidStyles)
}

exports.default = series(bulidStyles, watchTask)