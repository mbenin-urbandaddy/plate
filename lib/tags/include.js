module.exports = IncludeNode

var Promise = require('../promise')

function IncludeNode(target_var, withs, loader) {
  this.target_var = target_var
  this.loader = loader
  this.withs = withs
}

var cons = IncludeNode
  , proto = cons.prototype

cons.parse = function(contents, parser) {
  var bits = contents.split(' ')
    , varname = parser.compile(bits.slice(1).join(' '))
    , loader = parser.plugins.lookup('loader')
    , pairs = bits.slice(3)
    , withs = {}

    for(var pair in pairs) {
        pair = pairs[pair].split('=')
        withs[pair[0]] = pair[1].replace(/^(?:"|')(.*)(?:"|')$/, '$1')
    }

  return new cons(varname, withs, loader)
}

proto.render = function(context, target) {
  var self = this
    , withs = this.withs
    , promise

  for(var k in withs) {
     if(withs.hasOwnProperty(k)) {
       context[k] = withs[k]
    }
  }

  target = target || this.target_var.resolve(context)

  if(target.constructor === Promise) {
    promise = new Promise

    target.once('done', function(data) {
      promise.resolve(self.render(context, data))
    })

    return promise
  }

  target = self.get_template(target)

  if(target.constructor === Promise) {
    promise = new Promise

    target.once('done', function(data) {
      promise.resolve(self.render(context, data))
    })  

    return promise
  }

  promise = new Promise

  target.render(context, function(err, data) {
    promise.resolve(data)
  })

  return promise
}

proto.get_template = function(target) {
  if(typeof target === 'string') {
    return this.loader(target)
  }

  // okay, it's probably a template object
  return target
}
