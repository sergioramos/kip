# kip

## features

 * automatic `content-type` negotiation
 * `gzip`/`deflate` support
 * adjustable `manage`/`expires`
 * `fs.stat` cached and monitored to update on `fs` changes
 * adjustable file cache size
 * cache monitors file changes and updates his contents
 * content always streamed - except when in cache
 * ignored files (`.gitignore`/`.npmignore` style)
 * middleware compatible
 * cli tool