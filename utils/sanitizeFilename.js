// Strips path separators and parent-directory references so a filename
// can't be used to traverse outside its intended storage/zip directory.
module.exports = (filename) => filename.replace(/[/\\]/g, '_').replace(/\.\./g, '_')
