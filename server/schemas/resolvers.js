const { User } = require("../models");
const { signToken } = require("../utils/auth");
const { AuthenticationError } = require("apollo-server-express");

const resolvers = {
  //find the currently logged in user. If the user is logged in, the query will return the user's data. If the user is not logged in, the query will return an error message.
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const results = User.findOne({ _id: context.user._id });
        return results;
      }
      throw new AuthenticationError("You need to be logged in!");
    },
  },

  Mutation: {
    //create a new user. The mutation will return a token and the user's data if the user is successfully created.
    addUser: async (parent, { username, email, password }) => {
      const user = await User.create({ username, email, password });

      const token = signToken(user);

      return { token, user };
    },
    // log in an existing user. The mutation will return a token and the user's data if the user successfully logs in. If the user does not exist or the password is incorrect, the mutation will return an error message.
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError("No user found with this email address");
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError("Incorrect credentials");
      }

      const token = signToken(user);

      return { token, user };
    },
    //save a book to a user's `savedBooks` array. The mutation will return the user's data with the new book added to the `savedBooks` array.
    saveBook: async (
      parent,
      { bookId, authors, description, title, image, link },
      context
    ) => {
      if (context.user) {
        return User.findOneAndUpdate(
          { _id: context.user._id },
          {
            $addToSet: {
              savedBooks: { bookId, authors, description, title, image, link },
            },
          },
          { new: true, runValidators: true }
        );
      } else {
        throw new AuthenticationError("You need to be logged in!");
      }
    },
    //remove a book from a user's `savedBooks` array. The mutation will return the user's data with the book removed from the `savedBooks` array.
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        return User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } },
          { new: true, runValidators: true }
        );
      } else {
        throw new AuthenticationError("You need to be logged in!");
      }
    },
  },
};

module.exports = resolvers;
