// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title LostAndFound
/// @notice A small public noticeboard for lost-item reports on an EVM network.
/// @dev Do not store phone numbers, passwords, or other sensitive personal data on-chain.
contract LostAndFound {
    enum ItemStatus {
        Open,
        Found,
        Returned
    }

    struct LostItem {
        uint256 id;
        address reporter;
        string itemName;
        string description;
        string lastKnownLocation;
        uint256 reportedAt;
        ItemStatus status;
        address finder;
        string foundNote;
    }

    uint256 public itemCount;
    mapping(uint256 => LostItem) private items;

    event ItemReported(
        uint256 indexed itemId,
        address indexed reporter,
        string itemName,
        string lastKnownLocation
    );
    event ItemMarkedFound(uint256 indexed itemId, address indexed finder, string foundNote);
    event ItemReturned(uint256 indexed itemId, address indexed reporter);

    function reportLostItem(
        string calldata itemName,
        string calldata description,
        string calldata lastKnownLocation
    ) external {
        require(bytes(itemName).length > 0, "Item name is required");
        require(bytes(description).length > 0, "Description is required");
        require(bytes(lastKnownLocation).length > 0, "Location is required");

        uint256 itemId = itemCount;
        items[itemId] = LostItem({
            id: itemId,
            reporter: msg.sender,
            itemName: itemName,
            description: description,
            lastKnownLocation: lastKnownLocation,
            reportedAt: block.timestamp,
            status: ItemStatus.Open,
            finder: address(0),
            foundNote: ""
        });
        itemCount += 1;

        emit ItemReported(itemId, msg.sender, itemName, lastKnownLocation);
    }

    function markItemFound(uint256 itemId, string calldata foundNote) external {
        require(itemId < itemCount, "Item does not exist");
        require(items[itemId].status == ItemStatus.Open, "Item is not open");
        require(msg.sender != items[itemId].reporter, "Reporter cannot mark own item found");
        require(bytes(foundNote).length > 0, "A found note is required");

        items[itemId].status = ItemStatus.Found;
        items[itemId].finder = msg.sender;
        items[itemId].foundNote = foundNote;

        emit ItemMarkedFound(itemId, msg.sender, foundNote);
    }

    function confirmReturned(uint256 itemId) external {
        require(itemId < itemCount, "Item does not exist");
        require(msg.sender == items[itemId].reporter, "Only the reporter can confirm return");
        require(items[itemId].status == ItemStatus.Found, "Item must be marked found first");

        items[itemId].status = ItemStatus.Returned;
        emit ItemReturned(itemId, msg.sender);
    }

    function getItem(uint256 itemId) external view returns (LostItem memory) {
        require(itemId < itemCount, "Item does not exist");
        return items[itemId];
    }

    function getAllItems() external view returns (LostItem[] memory) {
        LostItem[] memory allItems = new LostItem[](itemCount);
        for (uint256 i = 0; i < itemCount; i++) {
            allItems[i] = items[i];
        }
        return allItems;
    }
}

