module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-browserify');
  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-watch');


  grunt.initConfig({
    browserify: {
      packageClient: {
        src: ['client/html.coffee'],
        dest: 'client/html.js',
        options: {
          transform: ['coffeeify'],
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

  grunt.registerTask( "update-authors", function () {
    var getAuthors = require("grunt-git-authors"),
    done = this.async();

    getAuthors({
      priorAuthors: grunt.config( "authors.prior")
      }, function(error, authors) {
        if (error) {
          grunt.log.error(error);
          return done(false);
        }

        grunt.file.write("AUTHORS.txt",
          "Authors ordered by first contribution\n\n" +
          authors.join("\n") + "\n");
      });
  });

  grunt.registerTask('build', ['browserify']);
  grunt.registerTask('default', ['build']);

};
