const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const pool = require('../db');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:5000/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const name = profile.displayName;

        let result = await pool.query(
          'SELECT * FROM users WHERE google_id = $1 OR email = $2',
          [googleId, email]
        );

        let user;

        if (result.rows.length > 0) {
          user = result.rows[0];
          if (!user.google_id) {
            const updated = await pool.query(
              'UPDATE users SET google_id = $1 WHERE id = $2 RETURNING *',
              [googleId, user.id]
            );
            user = updated.rows[0];
          }
        } else {
          const inserted = await pool.query(
  `INSERT INTO users (name, email, google_id, role, is_verified)
   VALUES ($1, $2, $3, 'member', true)
   RETURNING *`,
  [name, email, googleId]
);
          user = inserted.rows[0];
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: 'http://localhost:5000/api/auth/github/callback',
      scope: ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const githubId = profile.id;
        const name = profile.displayName || profile.username;
        // GitHub may not return email directly if private; fallback to a generated one
        const email =
          (profile.emails && profile.emails[0] && profile.emails[0].value) ||
          `${profile.username}@users.noreply.github.com`;

        let result = await pool.query(
          'SELECT * FROM users WHERE github_id = $1 OR email = $2',
          [githubId, email]
        );

        let user;

        if (result.rows.length > 0) {
          user = result.rows[0];
          if (!user.github_id) {
            const updated = await pool.query(
              'UPDATE users SET github_id = $1 WHERE id = $2 RETURNING *',
              [githubId, user.id]
            );
            user = updated.rows[0];
          }
        } else {
          const inserted = await pool.query(
  `INSERT INTO users (name, email, github_id, role, is_verified)
   VALUES ($1, $2, $3, 'member', true)
   RETURNING *`,
  [name, email, githubId]
);
          user = inserted.rows[0];
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;