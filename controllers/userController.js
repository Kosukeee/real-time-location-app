const User = require("../models/User");
const { AuthenticationError } = require("apollo-server");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.OAUTH_CLIENT_ID);

const findOrCreateUser = async token => {
  if (!token) {
    throw new AuthenticationError("No auth token provided");
  }
  const googleUser = await verifyGoogleToken(token);
  console.log({ googleUser });
  const user = await checkIfUserExists(googleUser.email);
  return user ? user : saveUser(googleUser);
};

const checkIfUserExists = async email => await User.findOne({ email }).exec();

const saveUser = googleUser => {
  const { email, name, picture } = googleUser;
  const user = { email, name, picture };
  return new User(user).save();
};

const verifyGoogleToken = async token => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.OAUTH_CLIENT_ID
    });
    console.log({ ticket });
    return ticket.getPayload();
  } catch (err) {
    throw new Error("Error verifying Google Token", err);
  }
};

module.exports = { findOrCreateUser };