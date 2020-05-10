const { AuthenticationError } = require('apollo-server');
const user = {
  _id: '1',
  name: 'Reed',
  email: 'reed@gmail.com',
  picture: 'https://coudinary.com/asdf'
};

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
  }
}