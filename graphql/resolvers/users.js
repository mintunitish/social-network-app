const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {UserInputError} = require('apollo-server');

const {SECRET_KEY} = require('../../config');
const User = require('../../models/User');
const {validateRegisterInput, validateLoginInput} = require("../../utils/validators");

function generateToken(user) {
    return jwt.sign({
        id: user.id,
        email: user.email,
        username: user.username
    }, SECRET_KEY, {expiresIn: '1h'});
}

module.exports = {
    Mutation: {
        async login(_, {username, password}) {
            const {errors, valid} = validateLoginInput(username, password);
            if (!valid) {
                throw new UserInputError('Errors', {errors});
            }

            const user = await User.findOne({username});
            if(!user) {
                    errors.general = 'These credentials are incorrect';
                throw new UserInputError('These credentials are incorrect', {errors});
            }

            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                errors.general = 'These credentials are incorrect';
                throw new UserInputError('These credentials are incorrect', {errors});
            }

            const token = generateToken(user);
            return {
                ...user._doc,
                id: user._id,
                token
            }
        },
        async register(_, {registerInput: {username, email, password, confirmPassword}}) {
            //Validate Input
            const {valid, errors} = validateRegisterInput(username, email, password, confirmPassword);
            if (!valid) {
                throw new UserInputError('Errors', {errors});
            }

            //User doesn't already exists
            const user = await User.findOne({username});
            if (user) {
                throw new UserInputError('Username is taken', {
                    errors: {
                        username: 'This username is taken'
                    }
                });
            }

            //Hash Password, create token
            password = await bcrypt.hash(password, 12);

            const newUser = new User({
                email,
                username,
                password,
                createdAt: new Date().toISOString()
            });

            const res = await newUser.save();

            const token = generateToken(res);

            return {
                ...res._doc,
                id: res._id,
                token
            }
        }
    }
}
