// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract THRAnchor {
    enum EventType {
        Registration,
        Transfer,
        Mortgage,
        Encumbrance,
        Mutation
    }

    struct Anchor {
        uint256 anchorId;
        bytes32 documentHash;
        bytes32 recordRefHash;
        EventType eventType;
        uint256 timestamp;
        address submittedBy;
    }

    uint256 public nextAnchorId;
    mapping(uint256 => Anchor) private anchors;
    mapping(bytes32 => uint256[]) private anchorsByDocumentHash;

    event AnchorCreated(
        uint256 indexed anchorId,
        bytes32 indexed documentHash,
        bytes32 indexed recordRefHash,
        EventType eventType,
        uint256 timestamp,
        address submittedBy
    );

    function createAnchor(
        bytes32 documentHash,
        bytes32 recordRefHash,
        EventType eventType
    ) external returns (uint256) {
        require(documentHash != bytes32(0), "Invalid document hash");
        require(recordRefHash != bytes32(0), "Invalid record reference hash");

        uint256 anchorId = nextAnchorId;

        anchors[anchorId] = Anchor({
            anchorId: anchorId,
            documentHash: documentHash,
            recordRefHash: recordRefHash,
            eventType: eventType,
            timestamp: block.timestamp,
            submittedBy: msg.sender
        });

        anchorsByDocumentHash[documentHash].push(anchorId);
        nextAnchorId += 1;

        emit AnchorCreated(
            anchorId,
            documentHash,
            recordRefHash,
            eventType,
            block.timestamp,
            msg.sender
        );

        return anchorId;
    }

    function getAnchor(uint256 anchorId) external view returns (Anchor memory) {
        return anchors[anchorId];
    }

    function getAnchorIdsByDocumentHash(bytes32 documentHash)
        external
        view
        returns (uint256[] memory)
    {
        return anchorsByDocumentHash[documentHash];
    }
}