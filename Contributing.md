## Generate APworld
### With script
Run the [build.sh](./build.sh) file. Require zip to be installed.
### Manually
Compress the whole `cookieclicker` folder into a zip, and replace `.zip` by `.apworld`. Be careful, the folder itself should be at the root of the archive, not the files themselves. You can ommit the `__pycache__` subfolder.
```
cookieclicker.apworld
    └─ cookieclicker/
       └─ *.py
```