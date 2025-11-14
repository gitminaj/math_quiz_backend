const { MatchmakingService } = require("../services/MatchmakingService");
const { GameRoomManager } = require("../services/GameRoomManager");
const { PlayerManager } = require("../services/PlayerManager");
const { QuestionService } = require("../services/QuestionService");

module.exports = function registerSocketHandlers(io) {
  const playerManager = new PlayerManager();
  const questionService = new QuestionService();
  const gameRoomManager = new GameRoomManager(questionService, io);
  const matchmakingService = new MatchmakingService(
    playerManager,
    gameRoomManager
  );

  io.on("connection", (socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Player joins the lobby

    // challenge player logic
//     socket.on('join-lobby', (playerData) => {
//   try {
//     console.log('socket id and player data in pvp', socket.id, playerData )
//     const player = playerManager.addPlayer(socket.id, playerData);
//     socket.emit('lobby-joined', { success: true, player, tese: "pvp" });

//     // Get list of opponents instead of auto match
//     const opponents = matchmakingService.findPotentialOpponents(player);
//     socket.emit('potential-opponents', opponents);

//   } catch (error) {
//     socket.emit('error', { message: error.message });
//   }
// });

// auto match logic
    socket.on("join-lobby", (playerData) => {
      try {
        const player = playerManager.addPlayer(socket.id, playerData);
        socket.emit("lobby-joined", { success: true, player });
        console.log('player joined lobby', playerData)

        // Start matchmaking
        matchmakingService.findMatch(player, (gameRoom) => {
          console.log('match found')
          matchmakingService.removeFromQueue(player);
          console.log(gameRoom.getOpposingPlayer(player.id))
          matchmakingService.removeFromQueue(
            gameRoom.getOpposingPlayer(player.id)
          );

          console.log('before gameroom player get call');
          // Notify both players about the match
          const players = gameRoom.getPlayers();
          console.log(players)
          players.forEach((p) => {
            console.log(p)
            io.to(p.socketId).emit("match-found", {
              gameRoom: gameRoom.getPublicData(),
              opponent: players.find((player) => player.id !== p.id),
              initialQuestionMeter: gameRoom.questionMeter,
            });
            console.log('match found')
          });

          // Start the game after a brief delay
          setTimeout(() => {
            gameRoom.startGame();
            console.log('GAME STARTED')
            players.forEach((p) => {
      
              io.to(p.socketId).emit("game-started", {
                gameState: gameRoom.getGameState(),
                currentQuestion: gameRoom.getCurrentQuestion(),
              });
            });
          }, 3000);
        });
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // Player submits an answer
    // socket.on("submit-answer", (data) => {
    //   try {
    //     const player = playerManager.getPlayer(socket.id);
    //     if (!player) throw new Error("Player not found");

    //     const gameRoom = gameRoomManager.getPlayerGameRoom(player.id);
    //     if (!gameRoom) throw new Error("Game room not found");

    //     const result = gameRoom.submitAnswer(
    //       player.id,
    //       data.answer,
    //       data.timeSpent
    //     );

    //     // Notify both players about the answer submission
    //     const players = gameRoom.getPlayers();
    //     players.forEach((p) => {
    //       io.to(p.socketId).emit("answer-submitted", {
    //         playerId: player.id,
    //         result: result,
    //         gameState: gameRoom.getGameState(),
    //         questionMeterUpdate: {
    //           newQM: result.questionMeter,
    //           controller: result.questionMeterController,
    //           isFirstToAnswer: result.isFirstToAnswer,
    //         },
    //       });
    //     });

    //     // Check if question is complete (both players answered or time up)
    //     if (gameRoom.isQuestionComplete()) {
    //       const questionResult = gameRoom.completeQuestion();
    //       players.forEach((p) => {
    //         io.to(p.socketId).emit("question-completed", {
    //           ...questionResult,
    //           questionMeterInfo: {
    //             currentQM: gameRoom.questionMeter,
    //             controller: gameRoom.questionMeterController,
    //           },
    //         });
    //       });

    //       // Move to next question or end game
    //       setTimeout(() => {
    //         if (gameRoom.hasMoreQuestions()) {
    //           gameRoom.nextQuestion();
    //           const nextQuestion = gameRoom.getCurrentQuestion();
    //           players.forEach((p) => {
    //             io.to(p.socketId).emit("next-question", {
    //               question: nextQuestion,
    //               gameState: gameRoom.getGameState(),
    //               questionMeter: gameRoom.questionMeter,
    //             });
    //           });
    //         } else {
    //           const finalResult = gameRoom.endGame();
    //           players.forEach((p) => {
    //             io.to(p.socketId).emit("game-ended", finalResult);
    //           });

    //           // Update player ratings
    //           playerManager.updatePlayerRatings(finalResult.players);

    //           // Clean up
    //           gameRoomManager.removeGameRoom(gameRoom.id);
    //         }
    //       }, 2000);
    //     }
    //   } catch (error) {
    //     socket.emit("error", { message: error.message });
    //   }
    // });

socket.on("submit-answer", (data) => {
  try {
    const player = playerManager.getPlayer(socket.id);
    if (!player) throw new Error("Player not found");

    const gameRoom = gameRoomManager.getPlayerGameRoom(player.id);
    if (!gameRoom) throw new Error("Game room not found");

    console.log('emiting next ques')
    // Only emit next question
    gameRoom.emitNextQuestion(player.id);
    console.log('emited next ques')

  } catch (err) {
    socket.emit("error", { message: err.message });
  }
});


    socket.on("game-completed", (data) => {
  try {
    const player = playerManager.getPlayer(socket.id);
    if (!player) throw new Error("Player not found");

    const gameRoom = gameRoomManager.getPlayerGameRoom(player.id);
    if (!gameRoom) throw new Error("Game room not found");

    // Save frontend result
    const finalOutcome = gameRoom.addFinalResult(player.id, data);

    // If winner is decided → broadcast
    if (finalOutcome) {
      gameRoom.players.forEach((p) => {
        io.to(p.socketId).emit("game-winner", finalOutcome);
      });
    }

  } catch (err) {
    socket.emit("error", { message: err.message });
  }
});


    // Player requests current game state
    socket.on("get-game-state", () => {
      try {
        const player = playerManager.getPlayer(socket.id);
        if (!player) throw new Error("Player not found");

        const gameRoom = gameRoomManager.getPlayerGameRoom(player.id);
        if (!gameRoom) throw new Error("Game room not found");

        socket.emit("game-state-update", {
          gameState: gameRoom.getGameState(),
          currentQuestion: gameRoom.getCurrentQuestion(),
          questionMeter: gameRoom.questionMeter,
        });
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // Player disconnects
    socket.on("disconnect", () => {
      console.log(`Player disconnected: ${socket.id}`);

      const player = playerManager.getPlayer(socket.id);
      if (player) {
        // Remove from matchmaking queue
        matchmakingService.removeFromQueue(player);

        // Handle game room disconnection
        const gameRoom = gameRoomManager.getPlayerGameRoom(player.id);
        if (gameRoom) {
          gameRoom.handlePlayerDisconnect(player.id);
          const remainingPlayer = gameRoom
            .getPlayers()
            .find((p) => p.id !== player.id);
          if (remainingPlayer) {
            io.to(remainingPlayer.socketId).emit("opponent-disconnected", {
              message: "Your opponent has disconnected. You win by default!",
              finalQuestionMeter: gameRoom.questionMeter,
            });
          }
          gameRoomManager.removeGameRoom(gameRoom.id);
        }

        // Remove player
        playerManager.removePlayer(socket.id);
      }
    });
  });
};
