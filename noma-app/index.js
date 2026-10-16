// App entry: background tasks must be defined before the router loads so the OS
// can run them when the app is launched headless (closed app, background sync).
import './src/tasks/offlineScanTask';
import 'expo-router/entry';
