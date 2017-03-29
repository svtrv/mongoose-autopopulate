var mongoose = require('mongoose');
var depth = 1, populateLevel;
module.exports = function(schema) {
  var pathsToPopulate = [];

  eachPathRecursive(schema, function(pathname, schemaType) {
    var option;
    if (schemaType.options && schemaType.options.autopopulate) {
      option = schemaType.options.autopopulate;
      pathsToPopulate.push({
        options: defaultOptions(pathname, schemaType.options),
        autopopulate: option
      });
    } else if (schemaType.options &&
        schemaType.options.type &&
        schemaType.options.type[0] &&
        schemaType.options.type[0].autopopulate) {
      option = schemaType.options.type[0].autopopulate;
      pathsToPopulate.push({
        options: defaultOptions(pathname, schemaType.options.type[0]),
        autopopulate: option
      });
    }
  });

  if (schema.virtuals) {
    Object.keys(schema.virtuals).forEach(function(pathname) {
      if (schema.virtuals[pathname].options.autopopulate) {
        pathsToPopulate.push({
          options: defaultOptions(pathname, schema.virtuals[pathname].options),
          autopopulate: schema.virtuals[pathname].options.autopopulate,
        });
      }
    });
  }

  var autopopulateHandler = function() {
    if(!populateLevel ||
      (populateLevel && schema.statics.populateLevel && schema.statics.populateLevel != populateLevel)) {
      var firsttime = true;
      populateLevel = schema.statics.populateLevel;
      depth = 1;
    }

    depth++;

	if (this._mongooseOptions && this._mongooseOptions.lean) return;
    var numPaths = pathsToPopulate.length;
    for (var i = 0; i < numPaths; ++i) {
	    console.log('populateLevel set to', populateLevel, 'and depth now is', depth, 'so we',
        ((depth<=populateLevel)? 'populate': 'do not populate'), pathsToPopulate[i].options.path)

        if(depth<=populateLevel)
          processOption.call(this,
              pathsToPopulate[i].autopopulate,
              pathsToPopulate[i].options);
    }

    if(firsttime)
      firsttime = false;
    else depth--;
  };

  schema.
    pre('find', autopopulateHandler).
    pre('findOne', autopopulateHandler);
};
