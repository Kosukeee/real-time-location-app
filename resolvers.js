const { AuthenticationError, PubSub } = require('apollo-server');
const Pin = require('./models/Pin');
const pubSub = new PubSub();
const PIN_ADDED = 'PIN_ADDED';
const PIN_DELETED = 'PIN_DELETED';
const PIN_UPDATED = 'PIN_UPDATED';

const authenticated = next => (root, args, context, info) => {
  console.log(context);
  if (!context.currentUser) {
    throw new AuthenticationError('You must be logged in');
  }

  return next(root, args, context, info);
}

module.exports = {
  Query: {
    me: authenticated((root, args, context) => context.currentUser),
    getPins: async (root, args, context) => {
      const pins = await Pin.find({}).populate('author').populate('comments.author');

      return pins;
    }
  },
  Mutation: {
    createPin: authenticated(async (root, args, context) => {
      const newPin = await new Pin({
        ...args.input,
        author: context.currentUser._id
      }).save();
      const pinAdded = await Pin.populate(newPin, 'author');

      pubSub.publish(PIN_ADDED, { pinAdded });
      return pinAdded;
    }),
    deletePin: authenticated(async (root, args, context) => {
      const pinDeleted = await Pin.findOneAndDelete({ _id: args.pinId }).exec()

      pubSub.publish(PIN_DELETED, { pinDeleted });
      return pinDeleted;
    }),
    createComment: authenticated(async (root, args, context) => {
      const newComment = { text: args.text, author: context.currentUser._id };
      const pinUpdated = await Pin.findOneAndUpdate(
        { _id: args.pinId },
        { $push: { comments: newComment } },
        { new: true }
      ).populate('author').populate('comments.author');

      pubSub.publish(PIN_UPDATED, { pinUpdated });
      return pinUpdated;
    })
  },
  Subscription: {
    pinAdded: {
      subscribe: () => pubSub.asyncIterator(PIN_ADDED)
    },
    pinDeleted: {
      subscribe: () => pubSub.asyncIterator(PIN_DELETED)
    },
    pinUpdated: {
      subscribe: () => pubSub.asyncIterator(PIN_UPDATED)
    }
  }
}