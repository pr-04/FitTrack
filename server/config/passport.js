const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;
                const avatar = profile.photos?.[0]?.value;
                const name = profile.displayName;

                // Try to find existing user by googleId
                let user = await User.findOne({ googleId: profile.id });

                if (!user) {
                    // Check if an account with the same email already exists
                    user = await User.findOne({ email });

                    if (user) {
                        // Link Google account to existing email account
                        user.googleId = profile.id;
                        user.avatar = user.avatar || avatar;
                        await user.save();
                    } else {
                        // Brand new user via Google
                        user = await User.create({
                            name,
                            email,
                            googleId: profile.id,
                            avatar,
                            password: null,
                        });
                    }
                }

                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

// Minimal session serialization (we use JWT, so we only store the id)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id).select('-password');
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;
