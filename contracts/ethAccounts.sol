pragma solidity ^0.4.18;

contract ethAccounts {

    //job structure
    struct Job {
        uint jobId;
        address admin;
        address client;
        string name;
        string description;
        uint256 quoteNo;
        uint256 price;
        bool paid;

        //date tracking variables
        string dateMade;
        string datePaid;
    }

      //state variables
      //mapping assos array -> point to Job
      mapping (uint => Job) public jobs;
      uint jobCounter;



    //events
    event LogAddJob(
        //index allows for filtering of address on the clients side
        uint256 indexed _jobId,
        address indexed _admin,
        address indexed _client,
        string _name,
        uint256 _price,
        string _dateMade
      );

      //event to log when jobs are paid for by the client
      event LogPayJob (
          uint256 indexed _jobId,
          address indexed _client,
          address indexed _admin,
          string _name,
          uint256 _price,
          string _date
        );


    //modifyer to allow only the stated client to pay for a job
    modifier onlyClient(address _clientAddress) {
      require(msg.sender == _clientAddress);
      _;
    }



    //addJob function : set details of the job
    function addJob(address _client, string _name, string _description, uint256 _quoteNo, uint256 _price, string _dateMade) public {
          //increment job counter
          jobCounter++;

          //store the new job
          jobs[jobCounter] = Job (
              jobCounter,
              msg.sender,
              _client,
              _name,
              _description,
              _quoteNo,
              _price,
              false,
              _dateMade,
              ""
            );

        //call event, pass in parameters
        LogAddJob(jobCounter, msg.sender, _client, _name, _price, _dateMade);

    }

    //get number of unpaid jobs
    function getUnpaidJobsLength() public view returns (uint) {
          return jobCounter;
    }

    //get unpaid get unpaid job id's - > return array
    function getUnpaidJobs() public view returns (uint[]) {
        //output array
        uint[] memory jobIds = new uint[](jobCounter);

        //unpaid job counter
        uint unpaid = 0;

        //iterate jobs
        for(uint i = 1; i <= jobCounter; i++) {
          //if unpaid add to array
            if(jobs[i].paid == false) {
              jobIds[unpaid] = jobs[i].jobId;
              unpaid++;
            }
        }

        uint[] memory sortedJobs = new uint[](unpaid);

        //copy jobIds array to new can pay array
        for(uint j = 0; j < unpaid; j++) {

            // this line of code causes invalid opcode error
            sortedJobs[j] = jobIds[j];

        }

        //return sorted array
        return sortedJobs;


    }

      //payJob function : pay for a job
      function payJob(uint _jobId, string _date) payable public {
          //check job has not already been paid
          require(jobCounter > 0);

          //check there is atleast one existing job
          require(_jobId > 0 && _jobId <= jobCounter);

          //get the article from the mapping assos array -> store in contract state
          Job storage job = jobs[_jobId];

          //check it is the client paying
          require(msg.sender == job.client);

          //check client paying is not the admin
          require(msg.sender != job.admin);

          //check the price
          require(msg.value == job.price);

          //store payment date
          job.datePaid = _date;

          //handle payment
          job.admin.transfer(msg.value);

          //set status to Paid
          job.paid = true;

          //trigger event
          LogPayJob(_jobId, job.client, job.admin, job.name, job.price, _date);



      }

}