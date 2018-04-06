# FD2-scratch-map

**1. Download the repo**

**2. Set up MongoDB:**

To use the application correctly you need to:

2.1 Install MongoDB

2.2 Restore a database. Database is uploaded to /mongo/scratchmap folder

Use CMD:

2.2.1 Navigate to the folder where MongoDB is installed

2.2.2 Navigate to /bin subfolder

2.2.3 Run

```
mongorestore --drop -d scratchmap <path to /mongo/scratchmap>
```

Warning! By default application uses port 3000 & Mongo port 27017. If you intend to use a different one, please change settings at server.js file.

**3. Run 'npm install'**

**4. Run 'npx webpack'**

**5. Run 'node server'**


All set! Go to your browser of choice (best viewed in Chrome!) and open the application at localhost:3000
