# Implemented Games

Games currently in the database and fully implemented in the codebase.

| id        | title     | cat     | color   | spec                       | component                              |
| --------- | --------- | ------- | ------- | -------------------------- | -------------------------------------- |
| asteroids | ASTEROIDS | SHOOTER | cyan    | specs/05-asteroids-game.md | src/components/games/AsteroidsGame.tsx |
| tetris    | TETRIS    | PUZZLE  | cyan    | specs/07-tetris-game.md    | src/components/games/TetrisGame.tsx    |
| arkanoid  | ARKANOID  | ARCADE  | magenta | specs/08-arkanoid-game.md  | src/components/games/ArkanoidGame.tsx  |
| snake     | SNAKE     | ARCADE  | green   | specs/09-snake-game.md     | src/components/games/SnakeGame.tsx     |

## Per-game routes

Each game follows the pattern established by Asteroids:

- Detail page: `src/app/games/<id>/page.tsx`
- Player page: `src/app/player/<id>/page.tsx`
- Score action: `src/app/player/<id>/actions.ts`
