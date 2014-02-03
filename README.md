Starlogger
---------

You can use Starlogger to log your travels on the game [Starbound](http://www.playstarbound.com).

Add planets, describe them, tag them. And then quickly find your logs with search and filters.

This application is made using [Node-Webkit](https://github.com/rogerwang/node-webkit), which allows to make use of node.js and web-techonlogies (HTML, CSS, JavaScript) to make desktop applications.

Changelog
---------

2.3.2 changes:

* UI Changes.
  * Hovering over a planet on the list will now expand its full description.
  * Other white-space changes, the UI should feel more compact, allowing to see more on the planet list/details screen.
* Support for future sectors, as well as sectors added by mods, filters for known sectors are automatically added.
  * Whenever a new planet is added, the application will check if that sectors is already known to the app, if it isn't you will see that sector added to the new filter list located at the top, to the left of the search bar.

2.0.0 changes:

-The app can now read your universe folder and automatically add new planets you visit. Go to the settings page, and enter the path to your universe folder, located where Starbound is installed.

1.7.0 changes:

-Tags now show on the planet list.

1.6.0 changes:

-Bug fix: Tags are no longer mandatory when adding a new planet.
