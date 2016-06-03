var glob = require('glob'),
    fs = require('fs'),
    path = require('path'),
    dockerfilelint = require('dockerfilelint');

module.exports = Analyzer;

function Analyzer(writable) {
  this.output = writable || process.stdout;
}

Analyzer.prototype.runEngine = function() {
  // Uses glob to traverse code directory and find files to analyze,
  // excluding files passed in with by CLI config
  var analysisFiles = [],
      excludePaths = [],
      allFiles = glob.sync("/code/**/**", {});

  allFiles.forEach(function(file){
    if(excludePaths.indexOf(file.split("/code/")[1]) < 0) {
      if(!fs.lstatSync(file).isDirectory()){
        analysisFiles.push(file);
      }
    }
  });

  analysisFiles.forEach(function(f){
    this.analyze(f);
  }.bind(this));
}

Analyzer.prototype.analyze = function(fileName) {
  // Only run this on a file that has the name "Dockerfile" in it
  if (!fileName.includes('Dockerfile')) {
    return;
  }

  var fileContent = '';
  var configFilePath = '.';

  try {
    var stats = fs.lstatSync(fileName);
    if (stats.isFile()) {
      fileContent = fs.readFileSync(fileName, 'UTF-8');
      configFilePath = path.resolve(path.dirname(fileName));
    }
  } catch (e) {
    if (e.code === 'ENOENT') {
      fileContent = fileName;
      fileName = '<contents>';
      configFilePath = './';
    }
  }

  var relativePath = fileName.replace(/^(\/code\/)/,"");
  var results = dockerfilelint.run(configFilePath, fileContent);
  results.forEach(function(result) {
    var category = this.translateCategory(result.rule);
    this.printIssue(relativePath, result.line, [category], result.rule, result.description);
  }.bind(this));
}

Analyzer.prototype.translateCategory = function(rule) {
  // ['Bug Risk', 'Clarity', 'Compatibility', 'Complexity', 'Duplication', 'Performance', 'Security', 'Style'];
  switch (rule) {
    case 'apt-get_missing_rm':
    case 'apt-get-update_require_install':
    case 'apt-get_missing_param':
    case 'apt-get_recommends':
    case 'apt-get-dist-upgrade':
    case 'apkadd-missing_nocache_or_updaterm':
    case 'apkadd-missing-virtual':
      return 'Performance';

    case 'uppercase_commands':
    case 'expose_host_port':
      return 'Style';

    case 'required_params':
    case 'apt-get-upgrade':
    case 'from_first':
    case 'invalid_line':
    case 'sudo_usage':
    case 'invalid_port':
    case 'invalid_command':
    case 'label_invalid':
    case 'extra_args':
    case 'missing_args':
    case 'add_src_invalid':
    case 'add_dest_invalid':
    case 'invalid_workdir':
    case 'invalid_format':
      return 'Bug Risk';

    case 'missing_tag':
    case 'latest_tag':
      return 'Clarity';
  }

  return 'Bug Risk';
}

Analyzer.prototype.printIssue = function(fileName, lineNum, categories, name, message) {
// Prints properly structured Issue data to STDOUT according to Code Climate Engine specification.
  var issue = {
    "type": "issue",
    "check_name": name,
    "description": message,
    "categories": categories,
    "location":{
      "path": fileName,
      "lines": {
        "begin": lineNum,
        "end": lineNum
      }
    }
  };

  this.output.write(JSON.stringify(issue) + '\0');
}
