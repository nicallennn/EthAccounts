pragma solidity ^0.4.18;

contract eaProto2 {

    //state variables
    address admin;
    address client;
    string name;
    string description;
    uint256 quoteNo;
    uint256 price;
    bool paid;

    string datePaid;

    //events
    event LogAddJob(
      //index allows for filtering of address on the clients side
      address indexed _admin,
      address indexed _client,
      string _name,
      uint256 _price
      );

      //event to log when jobs are paid for by the client
      event LogPayJob (
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
    function addJob(address _client, string _name, string _description, uint256 _quoteNo, uint256 _price) public {

        //set the state variables
        admin = msg.sender;
        client = _client;
        name = _name;
        description = _description;
        quoteNo = _quoteNo;
        price = _price;
        paid = false;

        //call event, pass in parameters
        LogAddJob(admin, client, name, price);

    }

    //getJob function : returns details of a job
    function getJob() public view returns(
        address _admin,
        address _client,
        string _name,
        string _description,
        uint256 _quoteNo,
        uint256 _price,
        bool _paid,
        string _datePaid
      ){
        //return values
        return(admin, client, name, description, quoteNo, price, paid, datePaid);

      }

      //payJob function : pay for a job
      function payJob(string _date) payable public {
        //check job has not already been paid
        require(paid != true);

        //check client paying is not the admin
        require(msg.sender != admin);

        //check the price
        require(msg.value == price);

        //store payment date
        datePaid = _date;

        //handle payment
        admin.transfer(msg.value);

        //set status to Paid
        paid = true;

        //trigger event
        LogPayJob(client, admin, name, price, datePaid);



      }



}
