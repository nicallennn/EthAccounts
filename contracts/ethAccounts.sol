pragma solidity ^0.4.18;

//import contracts to inherit
import "./Employees.sol";
import "./Resources.sol";

contract ethAccounts is Employees, Resources {

    //job structure
    struct Job {
        uint256 jobId;
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
    modifier onlyClient(uint _jobId) {
      require(msg.sender == jobs[_jobId].client);
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
    function getJobsLength() public view returns (uint) {
          return jobCounter;
    }

    //get unpaid job id's - > return array
    function getUnpaidJobs(bool adminOrClient) public view returns (uint[]) {
        //output array
        uint[] memory jobIds = new uint[](jobCounter);

        //unpaid job counter
        uint unpaid = 0;

        //iterate jobs
        for(uint i = 1; i <= jobCounter; i++) {
            //if unpaid add to array
            //if admin user, get unpiad jobs
            if(adminOrClient){
                if(!jobs[i].paid && jobs[i].admin == msg.sender) {
                  jobIds[unpaid] = jobs[i].jobId;
                  unpaid++;
                }
            }
            //if client user, get unpaid jobs, && jobs[i].client == msg.sender
            else{
                if(!jobs[i].paid && jobs[i].client == msg.sender) {
                  jobIds[unpaid] = jobs[i].jobId;
                  unpaid++;
                }
             }
          }

        //initialise new memory array with size of unpaid variable
        uint[] memory sortedJobs = new uint[](unpaid);

        //copy jobIds array to new smaller array
        for(uint j = 0; j < unpaid; j++) {
            sortedJobs[j] = jobIds[j];
        }

        //return sorted array
        return sortedJobs;


    }

    //get unpaid get unpaid job id's - > return array
    function getPaidJobs(bool adminOrClient) public view returns (uint[]) {
        //output array
        uint[] memory jobIds = new uint[](jobCounter);

        //unpaid job counter
        uint paid = 0;

        //iterate jobs
        for(uint i = 1; i <= jobCounter; i++) {
          //if unpaid add to array
          //if admin user, get unpiad jobs
          if(adminOrClient ){
              if(jobs[i].paid && jobs[i].admin == msg.sender) {
                jobIds[paid] = jobs[i].jobId;
                paid++;
              }
          }
          //if client user, get unpaid jobs
          else {
            if(jobs[i].paid && jobs[i].client == msg.sender) {
              jobIds[paid] = jobs[i].jobId;
              paid++;
          }
        }
      }

        uint[] memory sortedJobs = new uint[](paid);

        //copy jobIds array to new can pay array
        for(uint j = 0; j < paid; j++) {

            // this line of code causes invalid opcode error
            sortedJobs[j] = jobIds[j];

        }

        //return sorted array
        return sortedJobs;


    }

      //payJob function : pay for a job
      function payJob(uint _jobId, string _date) payable onlyClient(_jobId) public {
          //check atleast one job exists
          require(jobCounter > 0);

          //check there is atleast one existing job
          require(_jobId > 0 && _jobId <= jobCounter);


          //get the job from the mapping assos array -> store in contract state
          Job storage job = jobs[_jobId];

          //check the job has not already been Paid
          require(job.paid != true);

          //check client paying is not the admin
          //require(msg.sender != job.admin);

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
