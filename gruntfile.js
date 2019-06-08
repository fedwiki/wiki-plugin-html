module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-git-authors');


  grunt.initConfig({
    browserify: {
      packageClient: {
        src: ['client/html.coffee'],
        dest: 'client/html.js',
        options: {
          transform: [[ 'coffeeify', { transpile: { presets: ['@babel/preset-env'] } } ]],
          browserifyOptions: {
            extensions: ".coffee"
          }
        }
      }
    },

    watch: {
      all: {
        files: ['client/*.coffee'],
        tasks: ['browserify']
      }
    }
  });

  grunt.registerTask('build', ['browserify']);
  grunt.registerTask('default', ['build']);

};
