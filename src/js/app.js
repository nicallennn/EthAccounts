App = {
     web3Provider: null,
     contracts: {},
     account: 0x0,


     init: function() {
          $date = new Date();
          return App.initWeb3();
     },

/***********                   **************                   ************/

     initWeb3: function() {
          // init web3
          //reuse provider
          if(typeof web3 !== 'undefined'){
            App.web3Provider = web3.currentProvider;
          }
          else {
            //create new provider
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
          }

          //create web3 object
          web3 = new Web3(App.web3Provider);

          //display account info
          App.displayAccountInfo();

          //init contract connection
          return App.initContract();
     },

/***********                   **************                   ************/

     displayAccountInfo: function() {
       web3.eth.getCoinbase(function(err, account) {
         if(err === null) {
           App.account = account;
           $('#account').text("Account: " + account);
           web3.eth.getBalance(account, function(err, balance){
             if(err === null){
               $('#accountBalance').text("Balance: " + web3.fromWei(balance, "ether").toFixed(4) + " ETH");
             }
             //convert the balance to gbp
             App.convertToGbp(web3.fromWei(balance, "ether"));

           });
         }

         //log the date to the console
         //var date = new Date();
         console.log($date.toUTCString());
       });


     },

/***********                   **************                   ************/

     convertToGbp: function(balanceInEth) {
       var ethValue = "https://api.coinmarketcap.com/v1/ticker/ethereum/?convert=GBP&limit=1";
       $.getJSON(ethValue, function(data){
         var gbp = (data[0].price_gbp * balanceInEth);
         $('#accountGbp').text("£" + (gbp).toFixed(2));
           //test output
           //console.log(gbp);
           //return gbp;
       });

     },

/***********                   **************                   ************/

     initContract: function() {
          //jquery ajax call
          $.getJSON('eaProto2.json', function(eaProto1Artifact) {
            //get contract and init truffle contract abstraction
            App.contracts.eaProto2 = TruffleContract(eaProto1Artifact);

            //set provider for contract
            App.contracts.eaProto2.setProvider(App.web3Provider);

            //add event eventListener
            App.eventListener();

            //retrieve job from contract
            return App.reloadJobs();

          });
     },

/***********                   **************                   ************/

     reloadJobs: function() {
       //refresh account info
       App.displayAccountInfo();

       //get the job placeholder
       $('#jobsRow').empty();
       App.contracts.eaProto2.deployed().then(function(instance) {
        return instance.getJob();
      }).then(function(job){
        //check if any jobs exist
        if(job[0] == 0x0) {
          //no job
          return;
        }

        //get the price of the job
        var price = web3.fromWei(job[5], "ether");

        //set default status, if true set status to
        var status = "Unpaid";
        if(job[6] == true) {
            status = "Paid";
        }

        //check if user is admin
        var admin = job[0].substring(0,8) + "...";
        if(admin == App.account) {
          admin = "You are the owner of this job";
        }


        //get jobs display location
        var jobs = $('#jobs');
        var price = web3.fromWei(job[5], "ether");

        //add to jobsRow -> move this below next section
        $('#jobsRow').append(jobs.html());

        $('#jobs-table').append('<tr><td>'
        + job[2] +
        '</td><td>'
        + job[1].substring(0,8) + "..." +
        '</td><td>'
        + job[3] +
        '</td><td>'
        + job[4] +
        '</td><td>'
        + price +
        '</td><td>'
        + status +
        '</td><td>'
        + admin +
        '</td><td>'
        + job[8] +
        '</td><td><button type="button" class="btn btn-default btn-pay" data-value="{' + price + '}" onclick="App.payJob(); return false;">Buy</button></td></tr>');


      }).catch(function(err) {
        console.error(err.message);
      });


     },

/***********                   **************                   ************/

    addJob: function() {
        //get the details of the new job
        var _jobs_client = $('#jobs_client').val();
        var _jobs_name = $('#jobs_name').val();
        var _jobs_quote_no = $('#jobs_quoteNo').val();
        var _jobs_price = web3.toWei(parseFloat($('#jobs_price').val() || 0));
        var _jobs_description = $('#jobs_description').val();
        var _dateMade = $date.toUTCString();

        if((_jobs_name.trim() == '') || (_jobs_price == 0)) {
          //no new jobs
          return false;
        }

        App.contracts.eaProto2.deployed().then(function (instance) {
          return instance.addJob(_jobs_client, _jobs_name, _jobs_description, _jobs_quote_no, _jobs_price, _dateMade, {
            from: App.account,
            gas: 500000,
          });
        }).then(function(result) {

          //catch any errors
        }).catch(function(err) {
          //log errors
          console.error(err);
        });

    },

/***********                   **************                   ************/

    payJob: function() {
      //block default events
      event.preventDefault();

      //get the job price. event.target is the button clicked
      var _price = $(event.target).data('value');

      //remove all non-numeric chars
      _price = _price.replace(/[^0-9\.]+/g, "");

      //parse to float
      _price = parseFloat(_price);


      //call the payJob function
      App.contracts.eaProto2.deployed().then(function(instance) {
        return instance.payJob( {
          from: App.account,
          value: web3.toWei(_price, "ether"),
          gas: 600000
        }).then(function(result) {

          //catch any errors
        }).catch(function(err) {
          //log errors
          console.error(err);
        });
      });


    },

/***********                   **************                   ************/

    //listen for contract triggered events
    eventListener: function() {
        //get instance of deployed contact
        App.contracts.eaProto2.deployed().then(function(instance) {
          instance.LogAddJob({}, {}).watch(function(error, event) {
            //check for errors
            if(!error) {
              //add events to list on page
              $("#events").append('<li class="list-group-item"> ' + event.args._name + ' has been added.</li>')
            } else {
              console.error(error);
            }
            App.reloadJobs();
          });

          instance.LogPayJob({}, {}).watch(function(error, event) {
            //check for errors
            if(!error) {
              //add events to list on page
              $("#events").append('<li class="list-group-item"> ' + event.args._client + ' client paid ' + event.args._admin +
                ' ' + event.args._price + ' for '  + event.args._name + '</li>')
            } else {
              console.error(error);
            }
            App.reloadJobs();
          });

        });
    }

};

$(function() {
     $(window).load(function() {
          App.init();
     });
});
