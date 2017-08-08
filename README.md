
	- Password security
		- don't store passwords in plain text
		- Hash passwords
			- SHA Example: http://www.xorbin.com/tools/sha256-hash-calculator
				- "this is a test" == 2e99758548972a8e8822ad47fa1017ff72f06f3ff6a016851f45c398732bc50c
			- MD5 Example: http://www.md5.cz/
				- "this is a test" = 54b0c58c7ce9f2a8b551351102ee0938
			- Unique output for every string
				- collisions found for md5
			- 1 way encryption
				- "can't" be decrypted
				- rainbow tables: https://crackstation.net/
			- "salt" your hashes
				- prepend strings with extra text
					- (for me) http://www.unit-conversion.info/texttools/random-string-generator/

	- Bcrypt
		- password hashing module
		- not md5 or sha
		- not vulnerable to rainbow tables due to salting

		- require:
			- const bcrypt = require('bcryptjs');
		- hash:
			- bcrypt.hashSync(password, 8);
			- 8 is extra information for the salting algorithm.
				- presumably larger is stronger but more expensive.
		- validate password:
			- bcrypt.compareSync(password, hash);
		- Can be used with promises too

	- With Mongoose:
		- https://newline.theironyard.com/admin/objectives/4599#using_this_with_mongoose
		- Put passwordHash in schema, not password
		- Create instance method to set password hash:
			userSchema.methods.setPassword = function (password) {
			  const hash = bcrypt.hashSync(password, 8);
			  this.passwordHash = hash;
			}
		- Create static and instance methods to authenticate a user
			// add an instance method to the user to authenticate that a provided password matches the user's hash
			userSchema.methods.authenticate = function(password) {
			  return bcrypt.compareSync(password, this.passwordHash);
			};

			// add a static method to authenticate a user
			userSchema.statics.authenticate = function(emailAddress, password, done) {
			  return this.findOne({ emailAddress }).then(user => {
				return user && user.authenticate(password) ? user : null;
			  });
			};

	- Passport
		- Follow along here:
			https://newline.theironyard.com/admin/objectives/4598
		- With Twitter:
			https://newline.theironyard.com/admin/objectives/4606
		- Full example:
			https://github.com/tiycnd/express-mongoose-auth
	
