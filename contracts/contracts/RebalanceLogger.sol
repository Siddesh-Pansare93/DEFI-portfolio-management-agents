
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title RebalanceLogger
 * @notice Logs AI agent portfolio recommendations on-chain for transparency
 * @dev Non-custodial: This contract does NOT hold user funds
 */
contract RebalanceLogger {
    
    // Struct to store each recommendation
    struct Recommendation {
        address user;           // User's wallet address
        string action;          // "swap", "add_liquidity", "remove_liquidity", "hold"
        string details;         // JSON string with full recommendation details
        uint256 timestamp;      // When recommendation was made
        bool executed;          // Whether user executed this recommendation
    }

    // Storage: user address => array of their recommendations
    mapping(address => Recommendation[]) public userRecommendations;

    // Events for off-chain indexing
    event RecommendationLogged(
        address indexed user,
        string action,
        string details,
        uint256 timestamp,
        uint256 recommendationIndex
    );

    event RecommendationExecuted(
        address indexed user,
        uint256 indexed recommendationIndex,
        uint256 executionTimestamp
    );

    /**
     * @notice Log a new recommendation from the AI agent system
     * @param action Type of action recommended (swap, add_liquidity, etc.)
     * @param details JSON string with full recommendation details
     */
    function logRecommendation(
        string memory action,
        string memory details
    ) external returns (uint256) {
        Recommendation memory newRec = Recommendation({
            user: msg.sender,
            action: action,
            details: details,
            timestamp: block.timestamp,
            executed: false
        });

        userRecommendations[msg.sender].push(newRec);
        uint256 index = userRecommendations[msg.sender].length - 1;

        emit RecommendationLogged(
            msg.sender,
            action,
            details,
            block.timestamp,
            index
        );

        return index;
    }

    /**
     * @notice Mark a recommendation as executed (user performed the action)
     * @param recommendationIndex Index of the recommendation to mark
     */
    function markAsExecuted(uint256 recommendationIndex) external {
        require(
            recommendationIndex < userRecommendations[msg.sender].length,
            "Invalid recommendation index"
        );
        require(
            !userRecommendations[msg.sender][recommendationIndex].executed,
            "Already marked as executed"
        );

        userRecommendations[msg.sender][recommendationIndex].executed = true;

        emit RecommendationExecuted(
            msg.sender,
            recommendationIndex,
            block.timestamp
        );
    }

    /**
     * @notice Get a specific recommendation for a user
     * @param user User's address
     * @param index Index of the recommendation
     */
    function getRecommendation(address user, uint256 index)
        external
        view
        returns (Recommendation memory)
    {
        require(
            index < userRecommendations[user].length,
            "Invalid index"
        );
        return userRecommendations[user][index];
    }

    /**
     * @notice Get total number of recommendations for a user
     * @param user User's address
     */
    function getRecommendationCount(address user)
        external
        view
        returns (uint256)
    {
        return userRecommendations[user].length;
    }

    /**
     * @notice Get the latest recommendation for a user
     * @param user User's address
     */
    function getLatestRecommendation(address user)
        external
        view
        returns (Recommendation memory)
    {
        require(
            userRecommendations[user].length > 0,
            "No recommendations found"
        );
        return userRecommendations[user][userRecommendations[user].length - 1];
    }

    /**
     * @notice Get all recommendations for a user
     * @param user User's address
     */
    function getAllRecommendations(address user)
        external
        view
        returns (Recommendation[] memory)
    {
        return userRecommendations[user];
    }

    /**
     * @notice Get only executed recommendations for a user
     * @param user User's address
     */
    function getExecutedRecommendations(address user)
        external
        view
        returns (Recommendation[] memory)
    {
        uint256 executedCount = 0;
        
        // Count executed recommendations
        for (uint256 i = 0; i < userRecommendations[user].length; i++) {
            if (userRecommendations[user][i].executed) {
                executedCount++;
            }
        }

        // Create array of executed recommendations
        Recommendation[] memory executed = new Recommendation[](executedCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < userRecommendations[user].length; i++) {
            if (userRecommendations[user][i].executed) {
                executed[currentIndex] = userRecommendations[user][i];
                currentIndex++;
            }
        }

        return executed;
    }
}