var path = require('path');
var fs = require('fs');
var colors = require('colors');
var shell = require('shelljs');

const VERSION_REG_EXP = /(\d\.+){2,3}\d+/;
const READ_TPL = 'Read file: %s.\n';
const READ_ERR_TPL = 'A Failure occured while read %s, %s.\n';
const COMMIT_ERR = 'Git commit failed!\n';
const COMMIT_SUCCESS = 'Git committed!\n';
const TAG_ERR = 'Git tag failed!\n';
const TAG_SUCCESS = 'Git tagged!\n';
const WRITE_LOG_TPL = 'Added tag "%s" to file: %s.\n';
const WRITE_ERR_TPL = 'A Failure occured while writting file %s.\n';

exports.name = 'tag';
exports.desc = 'Tagging your project';
exports.options = {
    '-c <config>': 'path of the config file',
    '-v <tagname>': 'specify the tagname',
    '-m <message>': 'add additional message to the git tag',
    '-h, --help': 'print this help message'
};

exports.run = function (argv, cli, env) {
    // 显示帮助信息
    if (argv.h || argv.help) {
        return cli.help(exports.name, exports.options);
    }
    // 检查git
    if (!shell.which('git')) {
        return fis.log.error(colors.red('Sorry, this script requires git!'));
    }
    // 检查tag是否符合规范
    if (!VERSION_REG_EXP.test(argv.v)) {
        return fis.log.error(colors.red(`Sorry, the tag must match with the pattern "${VERSION_REG_EXP}"!`));
    }

    var tagConfigPath = typeof argv.c === 'string' ? argv.c : '/tag.json';
    var tagConfig = fis.util.readJSON(path.join(process.cwd(), tagConfigPath));

    // 写入文件
    for (var file in tagConfig) {
        var tmp = tagConfig[file];
        tmp.path = path.join(process.cwd(), tmp.path);
        var regExp = new RegExp(tmp.regExp, 'gim');
        readWrite(tmp.path, regExp, argv.v);
    }

    // git 提交文件修改
    if (shell.exec('git commit -am "chore(version): change version"').code !== 0) {
        return fis.log.error(colors.red(COMMIT_ERR));
    }

    fis.log.info(colors.green(COMMIT_SUCCESS));

    // git add tag
    var gitTagCmd = `git tag -a ${argv.v} -m "${argv.m ? argv.v : argv.m}"`;

    if (shell.exec(gitTagCmd).code !== 0) {
        return fis.log.error(colors.red(TAG_ERR));
    }
    return fis.log.info(colors.green(TAG_SUCCESS));
};

function readWrite(filePath, regExp, tag) {
    try {
        var data = fs.readFileSync(filePath, 'utf8');
        fis.log.info(colors.green(READ_TPL), filePath);
        var fileData = data.toString();
        var newVersionLine = fileData.match(regExp)[0]
            .replace(VERSION_REG_EXP, tag);
        var newFileData = fileData.replace(regExp, newVersionLine);
        try {
            fs.writeFileSync(filePath, newFileData);
            return fis.log.info(
                colors.green(WRITE_LOG_TPL),
                tag,
                filePath
            );
        } catch (err) {
            return fis.log.error(
                colors.red(WRITE_ERR_TPL),
                filePath,
                err
            );
        }
    } catch (err) {
        return fis.log.error(
            colors.red(READ_ERR_TPL),
            filePath,
            err
        );
    }
}