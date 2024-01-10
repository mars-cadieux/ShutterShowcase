ShutterShowcase Initialization Instructions:

1. Navigate to the folder titled "Mars Cadieux Term Project" in your file explorer and open a Node JS terminal in this folder.
2. From your terminal, run the command 'npm install' from within the same folder as the file 'package.json'. In this case, 'package.json' is located in the folder "Mars Cadieux Term Project".
3. Ensure you have your local MongoDB running (either as a service or add its path in the relevant folder).
4. In your Node JS terminal from within the same folder ("Mars Cadieux Term Project"), run the command 'node generator.js'. This will create and populate the database called ShutterShowcase using the data from 'photogallery.json'.
5. After 'generator.js' has successfully run, you will see all of the new documents printed to the console as well as confirmation messages indicating that all artworks, artists, and patrons have been saved. You may now run the command 'node server.js'.
6. Now that the server is listening, you may navigate to http://localhost:3000 in your web browser. Note that you will be redirected to http://localhost:3000/login and you will now see the ShutterShowcase login page.
7. Log in or create an account and have fun! Some pre-existing login credentials are:
   - Username: fox, password: 123 (patron)
   - Username: cat, password: meow (patron)
   - Username: focalpoint, password: artist (artist)
   - Username: bassbeats, password: artist (artist)
