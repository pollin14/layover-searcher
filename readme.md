# Layover searcher

It is a widget that returns a layover place if a direct route does not exist between two places given.

# Requirements

You need to install in you system

* nodejs
* npm
* git
* gulp (optional) `npm install -g gulp`

# Installation

1. Clone this project.
2. Enter in the directory created.
3. Run `npm install` to install all the dependencies of the project.

Now, you can run tasks with the command:

```bash
node_modules/gulp/bin/gulp task_name
```

If you installed gulp globally with `npm install -g gulp` then you only need to run

```bash
gulp task_name
```


# Mainly task

## Build
To build the widget you need to run the command

```bash
gulp build
```

The task builds the widget in the directory `build`. In that directory you can open the `index.html` you see the results.

You can use `watch` task to update all scripts and stylesheets automatically each time they change.

## Publish

To publish the widget you can run the command

```bash
gulp publish --prod
```

The flag `--prod` is required to update the url of all the script and stylesheets and optimize the sources.
The output of the command shows the url of the files uploaded. 