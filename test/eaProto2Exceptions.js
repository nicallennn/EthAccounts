//load the contract
var eaProto2 = artifacts.require("./eaProto2.sol");

//test suite

contract("eaProto2", function(accounts) {
  var eaProto2Instance;
  var admin = accounts[0];
  var client = accounts[1];
  var name = "Test client";
  var description = "Test description";
  var quoteNo = 1;
  var price = 5;
  var paid = false;
  var datePaid = "1/1/1";
  var datePaid2 = "2/2/2";

  //test case1 : catch exception for no job yet
  it("should throw an exception if no job is listed yet", function() {
    return eaProto2.deployed().then(function(instance) {
      eaProto2Instance = instance;
      return eaProto2Instance.payJob(datePaid, {
        from: client,
        value: web3.toWei(price, "ether")
        });
    }).then(assert.fail)
      .catch(function(error) {
        assert(true);
      }).then(function() {
        return eaProto2Instance.getJob();
      }).then(function(data) {
        assert.equal(data[0], 0x0, "admin must be empty");
        assert.equal(data[1], 0x0, "client must be empty");
        assert.equal(data[2], "", "job name shold be empty");
        assert.equal(data[3], "", "job description should be empty");
        assert.equal(data[4].toNumber(), 0, "job quoteNo. should be 0" );
        assert.equal(data[5].toNumber(), 0, "job price must be 0" );
        assert.equal(data[6], false, "paid should be false");
        assert.equal(data[7], "", "datePaid should be empty")
      });
  });

  //test case2 : catch exception for paying for already paid job
  it("should throw an exception if the job has already been paid", function() {
    return eaProto2.deployed().then(function(instance) {
      eaProto2Instance = instance;
      return eaProto2Instance.addJob(client, name, description, quoteNo, web3.toWei(price, "ether"), {from: admin});
  }).then(function() {
    return eaProto2Instance.payJob(datePaid, {
      from: client,
      value: web3.toWei(price, "ether")
    }).then(function() {
      return eaProto2Instance.getJob();
    }).then(function(data) {
      assert.equal(data[6], true, "paid must be set to " + true);
      assert.equal(data[7], datePaid, "datePaid must be " + datePaid)

    }).then(function() {
        return eaProto2Instance.payJob(datePaid2, {
          from: client,
          value: web3.toWei(price, "ether")
        }).then(assert.fail)
          .catch(function(error) {
            assert(true);
          }).then(function() {
            return eaProto2Instance.getJob();
          }).then(function(data) {
            assert.equal(data[6], true, "paid must be set to " + true);
            assert.equal(data[7], datePaid, "datePaid must still be " + datePaid)

          });
        });
      });

    });

    //test case3 : admin should not be able to pay their own job
    it("should throw an exception if the admin tries to pay for their own job", function() {
      //get an instance of the contract and store it in a state variable
      return eaProto2.deployed().then(function(instance) {
        eaProto2Instance = instance;
        //call addJob function to add a job
        return eaProto2Instance.addJob(client, name, description, quoteNo, web3.toWei(price, "ether"), {from: admin});
      }).then(function() {
        //call PayJob function to pay the job from the admin address
        return eaProto2Instance.payJob(datePaid, {
          from: admin,
          value: web3.toWei(price, "ether")
        }).then(assert.fail)
          //catch the revert - get function call back error
          .catch(function(error) {
           assert(true);
          }).then(function() {
            //call the getJob function
          return eaProto2Instance.getJob();
        }).then(function(data) {
          //check the staus is still false, i.e unpaid, i.e. admin was unable to pay their own job
          assert.equal(data[6], false, "paid must be set to " + false);
          });
        });
    });

    //test case4 : payment total must match jobs_price
    it("should throw an exception if the client pays the wrong amount", function() {
      eaProto2.deployed().then(function(instance) {
          eaProto2Instance = instance;
          return eaProto2Instance.payJob(datePaid, {
            from: client,
            value: web3.toWei(price - 1, "ether")
          }).then(assert.fail)
            .catch(function(error) {
              assert(true);
            }).then(function() {
              return eaProto2Instance.getJob();
            }).then(function(data) {
              assert.equal(data[0], admin, "admin must be " + admin);
              assert.equal(data[1], client, "client must be " + client);
              assert.equal(data[2], name, "job name must be " + name);
              assert.equal(data[3], description, "job description must be " + description);
              assert.equal(data[4].toNumber(), quoteNo, "job quoteNo. must be " + quoteNo );
              assert.equal(data[5].toNumber(), web3.toWei(price, "ether"), "job price must be" + price);
              assert.equal(data[6], false, "paid must be set to " + paid);
            });
        });

    });

});
