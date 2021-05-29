const Post = require('../../models/Post');

module.exports = {
    Query: {
        async getPosts() {
            try {
                return await Post.find();
            }
            catch (e) {
                throw new Error(e);
            }
        }
    }
};
