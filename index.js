var path = require('path');
var fs = require('fs');
var colors = require('colors');
var shell = require('shelljs');

const VERSION_REG_EXP = /(\d\.+){2,3}\d+/;

exports.name = 'tag <tagname>';
exports.desc = 'Tagging your project';
exports.options = {
  '-c <config>': 'path of the config file',
  '-m <message>': 'add additional message to the git tag',
  '-h, --help': 'print this help message'
};

exports.run = function(argv, cli, env) {
  // 显示帮助信息
  if (argv.h || argv.help) {
    return cli.help(exports.name, exports.options);
  }
  // 检查git
  if (!shell.which('git')) {
    return fis.log.error(colors.red('Sorry, this script requires git!'));
  }
  // 检查tag是否符合规范
  var version = argv['_'][1];
  if (!VERSION_REG_EXP.test(version)) {
    return fis.log.error(colors.red(`Sorry, the tag must match with the pattern "${VERSION_REG_EXP}"!`));
  }

  var tagConfigPath = typeof argv.c === 'string' ? argv.c : '/tag.json';
  var tagConfig = fis.util.readJSON(path.join(process.cwd(), tagConfigPath));

  // 写入文件
  var filePaths = [];

  for (var key in tagConfig) {
    if (tagConfig.hasOwnProperty(key)) {
      var file = tagConfig[key];
      file.path = path.join(process.cwd(), file.path);
      filePaths.push(file.path);
      tagFile(file.path, new RegExp(file.regExp, 'gim'), version);
    }
  }
  if (!filePaths.length) {
    return fis.log.error(colors.red('Config file is invalid!\n'));
  }

  // git 添加文件
  if (shell.exec('git add ' + filePaths.join(' ')).code !== 0) {
    return fis.log.error(colors.red('Git add failed!\n'));
  }

  // git 提交文件
  if (shell.exec(`git commit -m "chore[ALL][ALL](version) release v${version}" -n`).code !== 0) {
    return fis.log.error(colors.red('Git commit failed!\n'));
  }

  // git add tag
  var message = argv.m ? argv.m : ('v' + version);
  var gitTagCmd = `git tag -a v${version} -m "${message}"`;

  if (shell.exec(gitTagCmd).code !== 0) {
    return fis.log.error(colors.red('Git tag failed!\n'));
  }
  fis.log.info(colors.green('Git tag successfully!'));
  fis.log.info(colors.green('Current version: v' + version));
};
/**
 * 为文件打tag
 * @param filePath 文件路径
 * @param regExp 匹配的正则
 * @param tag 需要打的tag
 */
function tagFile(filePath, regExp, tag) {
  try {
    var fileContent = fs.readFileSync(filePath, 'utf8').toString();
    var versionContent = fileContent.match(regExp)[0]
      .replace(VERSION_REG_EXP, tag);
    var newFileContent = fileContent.replace(regExp, versionContent);
    try {
      fs.writeFileSync(filePath, newFileContent, 'utf8');
    } catch (err) {
      fis.log.error(
        colors.red('A Failure occured while writting file %s.\n'),
        filePath,
        err
      );
    }
  } catch (err) {
    fis.log.error(
      colors.red('A Failure occured while read %s, %s.\n'),
      filePath,
      err
    );
  }
}
