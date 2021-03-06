'use strict';

/* jshint -W030 */
/* jshint -W110 */
var chai = require('chai')
  , sinon = require('sinon')
  , expect = chai.expect
  , Sequelize = require(__dirname + '/../../../index')
  , Support = require(__dirname + '/../support')
  , current = Support.sequelize
  , Promise = current.Promise
  , config = require(__dirname + '/../../config/config');


describe(Support.getTestDialectTeaser('InstanceValidator'), function() {
  describe('validations', function() {
    var checks = {
      is: {
        spec: { args: ['[a-z]', 'i'] },
        fail: '0',
        pass: 'a'
      }
    , not: {
        spec: { args: ['[a-z]', 'i'] },
        fail: 'a',
        pass: '0'
      }
    , isEmail: {
        fail: 'a',
        pass: 'abc@abc.com'
      }
    , isUrl: {
        fail: 'abc',
        pass: 'http://abc.com'
      }
    , isIP: {
        fail: 'abc',
        pass: '129.89.23.1'
      }
    , isIPv4: {
        fail: 'abc',
        pass: '129.89.23.1'
      }
    , isIPv6: {
        fail: '1111:2222:3333::5555:',
        pass: 'fe80:0000:0000:0000:0204:61ff:fe9d:f156'
      }
    , isAlpha: {
        stringOrBoolean: true,
        spec: { args: 'en-GB' },
        fail: '012',
        pass: 'abc'
      }
    , isAlphanumeric: {
        stringOrBoolean: true,
        spec: { args: 'en-GB' },
        fail: '_abc019',
        pass: 'abc019'
      }
    , isNumeric: {
        fail: 'abc',
        pass: '019'
      }
    , isInt: {
        fail: '9.2',
        pass: '-9'
      }
    , isLowercase: {
        fail: 'AB',
        pass: 'ab'
      }
    , isUppercase: {
        fail: 'ab',
        pass: 'AB'
      }
    , isDecimal: {
        fail: 'a',
        pass: '0.2'
      }
    , isFloat: {
        fail: 'a',
        pass: '9.2'
      }
    , isNull: {
        fail: 0,
        pass: null
      }
    , notEmpty: {
        fail: '       ',
        pass: 'a'
      }
    , equals: {
        spec: { args: 'bla bla bla' },
        fail: 'bla',
        pass: 'bla bla bla'
      }
    , contains: {
        spec: { args: 'bla' },
        fail: 'la',
        pass: '0bla23'
      }
    , notContains: {
        spec: { args: 'bla' },
        fail: '0bla23',
        pass: 'la'
      }
    , regex: {
        spec: { args: ['[a-z]', 'i'] },
        fail: '0',
        pass: 'a'
      }
    , notRegex: {
        spec: { args: ['[a-z]', 'i'] },
        fail: 'a',
        pass: '0'
      }
    , len: {
        spec: { args: [2, 4] },
        fail: ['1', '12345'],
        pass: ['12', '123', '1234'],
        raw: true
      }
    , len$: {
        spec: [2, 4],
        fail: ['1', '12345'],
        pass: ['12', '123', '1234'],
        raw: true
      }
    , isUUID: {
        spec: { args: 4 },
        fail: 'f47ac10b-58cc-3372-a567-0e02b2c3d479',
        pass: 'f47ac10b-58cc-4372-a567-0e02b2c3d479'
      }
    , isDate: {
        fail: 'not a date',
        pass: '2011-02-04'
      }
    , isAfter: {
        spec: { args: '2011-11-05' },
        fail: '2011-11-04',
        pass: '2011-11-06'
      }
    , isBefore: {
        spec: { args: '2011-11-05' },
        fail: '2011-11-06',
        pass: '2011-11-04'
      }
    , isIn: {
        spec: { args: 'abcdefghijk' },
        fail: 'ghik',
        pass: 'ghij'
      }
    , notIn: {
        spec: { args: 'abcdefghijk' },
        fail: 'ghij',
        pass: 'ghik'
      }
    , max: {
        spec: { args: 23 },
        fail: '24',
        pass: '23'
      }
    , max$: {
        spec: 23,
        fail: '24',
        pass: '23'
      }
    , min: {
        spec: { args: 23 },
        fail: '22',
        pass: '23'
      }
    , min$: {
        spec: 23,
        fail: '22',
        pass: '23'
      }
    , isCreditCard: {
        fail: '401288888888188f',
        pass: '4012888888881881'
      }
    };

    var applyFailTest = function applyFailTest(validatorDetails, i, validator) {
        var failingValue = validatorDetails.fail[i];
        it('correctly specifies an instance as invalid using a value of "' + failingValue + '" for the validation "' + validator + '"', function() {
          var validations = {}
            , message = validator + '(' + failingValue + ')';

          validations[validator] = validatorDetails.spec || {};
          validations[validator].msg = message;

          var UserFail = this.sequelize.define('User' + config.rand(), {
            name: {
              type: Sequelize.STRING,
              validate: validations
            }
          });

          var failingUser = UserFail.build({ name: failingValue });

          return failingUser.validate().then(function(_errors) {
            expect(_errors).not.to.be.null;
            expect(_errors).to.be.an.instanceOf(Error);
            expect(_errors.get('name')[0].message).to.equal(message);
          });
        });
      }
      , applyPassTest = function applyPassTest(validatorDetails, j, validator, type) {
          var succeedingValue = validatorDetails.pass[j];
          it('correctly specifies an instance as valid using a value of "' + succeedingValue + '" for the validation "' + validator + '"', function() {
            var validations = {}
              , message = validator + '(' + succeedingValue + ')';

            validations[validator] = validatorDetails.spec || {};

            if (type === 'msg') {
              validations[validator].msg = message;
            } else if (type === 'args') {
              validations[validator].args = validations[validator].args || true;
              validations[validator].msg = message;
            } else if (type === 'true') {
              validations[validator] = true;
            }

            var UserSuccess = this.sequelize.define('User' + config.rand(), {
              name: {
                type: Sequelize.STRING,
                validate: validations
              }
            });
            var successfulUser = UserSuccess.build({ name: succeedingValue });
            return successfulUser.validate().then(function(errors) {
              expect(errors).to.be.undefined;
            }).catch(function(err) {
              expect(err).to.deep.equal({});
            });
          });
        };

      for (var validator in checks) {
        if (checks.hasOwnProperty(validator)) {
          validator = validator.replace(/\$$/, '');
          var validatorDetails = checks[validator];

          if (!validatorDetails.raw) {
            validatorDetails.fail = Array.isArray(validatorDetails.fail) ? validatorDetails.fail : [validatorDetails.fail];
            validatorDetails.pass = Array.isArray(validatorDetails.pass) ? validatorDetails.pass : [validatorDetails.pass];
          }

          for (var i = 0; i < validatorDetails.fail.length; i++) {
            applyFailTest(validatorDetails, i, validator);
          }

          for (i = 0; i < validatorDetails.pass.length; i++) {
            applyPassTest(validatorDetails, i, validator);
            applyPassTest(validatorDetails, i, validator, 'msg');
            applyPassTest(validatorDetails, i, validator, 'args');
            if (validatorDetails.stringOrBoolean || (validatorDetails.spec === undefined)) {
              applyPassTest(validatorDetails, i, validator, 'true');
            }
          }
        }
      }
  });

  describe('datatype validations', function () {
    current = Support.createSequelizeInstance({
      typeValidation: true
    });

    var User = current.define('user', {
      age: Sequelize.INTEGER,
      name: Sequelize.STRING,
      awesome: Sequelize.BOOLEAN,
      number: Sequelize.DECIMAL,
      uid: Sequelize.UUID
    });

    before(function () {
      this.stub = sinon.stub(current, 'query', function () {
        return new Promise(function (resolve) {
          resolve(User.build({}));
        });
      });
    });

    after(function () {
      this.stub.restore();
    });

    describe('should not throw', function () {
      describe('create', function () {
        it('should allow number as a string', function () {
          return expect(User.create({
            age: '12'
          })).not.to.be.rejected;
        });

        it('should allow decimal as a string', function () {
          return expect(User.create({
            number: '12.6'
          })).not.to.be.rejected;
        });

        it('should allow decimal big numbers as a string', function () {
          return expect(User.create({
            number: '2321312301230128391820831289123012'
          })).not.to.be.rejected;
        });

        it('should allow decimal as scientific notation', function () {
          return Promise.join(
            expect(User.create({
              number: '2321312301230128391820e219'
            })).not.to.be.rejected,
            expect(User.create({
              number: '2321312301230128391820e+219'
            })).not.to.be.rejected,
            expect(User.create({
              number: '2321312301230128391820f219'
            })).to.be.rejected
          );
        });

        it('should allow string as a number', function () {
          return expect(User.create({
            name: 12
          })).not.to.be.rejected;
        });

        it('should allow 0/1 as a boolean', function () {
          return expect(User.create({
            awesome: 1
          })).not.to.be.rejected;
        });

        it('should allow 0/1 string as a boolean', function () {
          return expect(User.create({
            awesome: '1'
          })).not.to.be.rejected;
        });

        it('should allow true/false string as a boolean', function () {
          return expect(User.create({
            awesome: 'true'
          })).not.to.be.rejected;
        });
      });

      describe('findAll', function () {
        it('should allow $in', function () {
          return expect(User.all({
            where: {
              name: {
                $like: {
                  $any: ['foo%', 'bar%']
                }
              }
            }
          })).not.to.be.rejected;
        });

        it('should allow $like for uuid', function () {
          return expect(User.all({
            where: {
              uid: {
                $like: '12345678%'
              }
            }
          })).not.to.be.rejected;
        });
      });
    });

    describe('should throw validationerror', function () {

      describe('create', function () {
        it('should throw when passing string', function () {
          return expect(User.create({
            age: 'jan'
          })).to.be.rejectedWith(current.ValidationError);
        });

        it('should throw when passing decimal', function () {
          return expect(User.create({
            age: 4.5
          })).to.be.rejectedWith(current.ValidationError);
        });
      });

      describe('update', function () {
        it('should throw when passing string', function () {
          return expect(User.update({
            age: 'jan'
          }, { where : {}})).to.be.rejectedWith(current.ValidationError);
        });

        it('should throw when passing decimal', function () {
          return expect(User.update({
            age: 4.5
          }, { where : {}})).to.be.rejectedWith(current.ValidationError);
        });
      });

    });
  });
});
