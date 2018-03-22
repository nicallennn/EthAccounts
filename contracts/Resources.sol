pragma solidity ^0.4.18;

import "./Expenses.sol";

contract Resources is Expenses {

  //resource data strucutre
  struct Resource {
    uint256 resourceId;
    address admin;
    address resourceAddress;
    string name;
    string description;
    uint256 total;
    uint256 poNumber;
    bool paid;
    string dateDue;
    string datePaid;
    bool expense;
  }

  //mapping
  mapping (uint => Resource) public resources;
  uint resourceCounter;


  //events
  event LogAddResource(
    uint256 indexed _resourceId,
    address indexed _admin,
    address indexed _resourceAddress,
    string _name,
    uint256 _poNumber,
    uint256 _total,
    string _dateDue
    );

  event LogPayResource(
    uint256 indexed _resourceId,
    address indexed _admin,
    address indexed _resourceAddress,
    string _name,
    uint256 _total,
    string _datePaid
    );

    //only admin modifyer
    modifier onlyResourceAdmin(uint _resourceId) {
      require(msg.sender == resources[_resourceId].admin);
      _;
    }

    //add resource FUNCTIONS
    function addResource(
      address _resourceAddress,
      string _name,
      string _description,
      uint256 _total,
      uint256 _poNumber,
      string _dateDue,
      bool _expense,
      string _dateMade) public {
      //increment resource counter
      resourceCounter++;

      //store the new resource
      resources[resourceCounter] = Resource (
          resourceCounter,
          msg.sender,
          _resourceAddress,
          _name,
          _description,
          _total,
          _poNumber,
          false,
          _dateDue,
          "",
          _expense
        );

        //if marked as expense, store the resource id
        if(_expense) {
          addAdminExpense(_name, _description, _total, _dateMade);
        }

        //log add resource
        LogAddResource(resourceCounter, msg.sender, _resourceAddress, _name, _poNumber, _total, _dateDue);
    }

    //get number of resources
    function getResourceLength() public view returns(uint) {
        return resourceCounter;
      }

    //get Resources function
    function getResources(bool paid) public view returns(uint[]) {
      //initial array
      uint[] memory resourceIds = new uint[](resourceCounter);

      //counter
      uint resourceNo = 0;


        for(uint i = 1; i<= resourceCounter; i++) {
          if(paid){
            if(resources[i].admin == msg.sender && resources[i].paid == true) {
              resourceIds[resourceNo] = resources[i].resourceId;
              resourceNo++;
            }
          }
          else{
            if(resources[i].admin == msg.sender && resources[i].paid == false) {
              resourceIds[resourceNo] = resources[i].resourceId;
              resourceNo++;
            }
          }
        }

      //sort to smaller array
      uint[] memory sortResources = new uint[](resourceNo);

      for(uint j = 0; j< resourceNo; j++) {
        sortResources[j] = resourceIds[j];
      }

      //return the sorted resource array
      return sortResources;
    }

    //pay resource function
    function payResource(uint _resourceId, string _date) onlyResourceAdmin(_resourceId) payable public {
      //check that a atleast one resource exists
      require(resourceCounter > 0);

      //check the resource is within the resources boundary
      require(_resourceId > 0 && _resourceId <= resourceCounter);

      //get the resource details from the mapping
      Resource storage rsc = resources[_resourceId];

      //check the payment matches the resource _total
      require(msg.value == rsc.total);

      //check the resource is not already paid
      require(rsc.paid != true);

      //make the Payment
      rsc.resourceAddress.transfer(msg.value);

      //store the payment date
      rsc.datePaid = _date;

      //mark the resource as paid
      rsc.paid = true;

      //trigger event
      LogPayResource(_resourceId, msg.sender, rsc.resourceAddress, rsc.name, rsc.total, _date);
    }



}
