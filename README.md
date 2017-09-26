# xg-command-tag
xg tag pulgin, for adding tags to the project.

## use
```$bash
xg tag [-c <config>] -v <tagname> [-m <message>]
```
## xg-command-tag config
Add a `tag.json` file to your project workspace. In order to help you to notice the file quickly, the keys are the files' names, and the corresponding value of a key are made of two parts: a path and a regExp for the tag.

For example:
```json
{
    "sonar-project.properties": {
        "path": "./sonar-project.properties",
        "regExp": "sonar.projectVersion=v((\\d+.){2,3}\\d+)"
    }
}
```
