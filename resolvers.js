const { AuthenticationError } = require('apollo-server');
const Pin = require('./models/Pin');

const authenticated = next => (root, args, context, info) => {
  console.log(context);
  if (!context.currentUser) {
    throw new AuthenticationError('You must be logged in');
  }

  return next(root, args, context, info);
}

module.exports = {
  Query: {
    me: authenticated((root, args, context) => context.currentUser)
  },
  Mutation: {
    createPin: authenticated(async (root, args, context) => {
      const newPin = await new Pin({
        ...args.input,
        author: context.currentUser._id
      }).save();
      const pinAdded = await Pin.populate(newPin, 'author');

      return pinAdded;
    })
  }
}