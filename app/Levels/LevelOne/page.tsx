'use client'

import { Fragment, useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@heroui/button';

interface Position {
  x: number;
  y: number;
}

interface Enemy {
  id: number;
  position: Position;
  type: 'normal' | 'boss';
  health: number;
  isDiving: boolean;
  diveProgress: number;
  diveTargetX: number;
  direction: number;
}

interface Bullet {
  id: number;
  position: Position;
  type: 'player' | 'enemy';
}

interface Explosion {
  id: number;
  position: Position;
  progress: number;
}

export default function GalagaGame(): JSX.Element {

  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver'>('menu');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);

  const [playerPositionState, setPlayerPositionState] = useState<Position>({ x: 200, y: 350 });
  const [enemiesState, setEnemiesState] = useState<Enemy[]>([]);
  const [bulletsState, setBulletsState] = useState<Bullet[]>([]);
  const [explosionsState, setExplosionsState] = useState<Explosion[]>([]);

  const gameAreaRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const keysPressed = useRef<Set<string>>(new Set());


  const gameStateRef = useRef(gameState);
  const playerRef = useRef<Position>(playerPositionState);
  const enemiesRef = useRef<Enemy[]>(enemiesState);
  const bulletsRef = useRef<Bullet[]>(bulletsState);
  const explosionsRef = useRef<Explosion[]>(explosionsState);


  const enemySpawnTimer = useRef<number>(0);
  const enemyShootTimer = useRef<number>(0);

  const PLAYER_SPEED = 0.12; 
  const BULLET_SPEED = 0.25; 
  const ENEMY_SPEED = 0.03; 
  const ENEMY_DIVE_SPEED = 0.35; 
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    playerRef.current = playerPositionState;
  }, [playerPositionState]);

  useEffect(() => {
    enemiesRef.current = enemiesState;
  }, [enemiesState]);

  useEffect(() => {
    bulletsRef.current = bulletsState;
  }, [bulletsState]);

  useEffect(() => {
    explosionsRef.current = explosionsState;
  }, [explosionsState]);


  const initGame = useCallback(() => {
    
    setScore(0);
    setLives(3);
    setLevel(1);
    setExplosionsState([]);
    setBulletsState([]);
    setEnemiesState([]);
    setPlayerPositionState({ x: 200, y: 350 });

  
    const initialEnemies: Enemy[] = [];
    const cols = 6;
    const rows = 2;
    const startX = 48;
    const gapX = 48;
    const startY = 44;
    const gapY = 44;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        initialEnemies.push({
          id: row * 100 + col,
          position: { x: startX + col * gapX, y: startY + row * gapY },
          type: 'normal',
          health: 1,
          isDiving: false,
          diveProgress: 0,
          diveTargetX: 0,
          direction: col % 2 === 0 ? 1 : -1
        });
      }
    }
    setEnemiesState(initialEnemies);

    enemySpawnTimer.current = 0;
    enemyShootTimer.current = 0;

    setGameState('playing');
    gameStateRef.current = 'playing';
    lastTimeRef.current = performance.now();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key);

      if (e.code === 'Space') {
        e.preventDefault();
        playerShoot();
      } else if (e.key === 'p' || e.key === 'P') {
        // toggle pausa
        if (gameStateRef.current === 'playing') {
          setGameState('paused');
          gameStateRef.current = 'paused';
        } else if (gameStateRef.current === 'paused') {
          setGameState('playing');
          gameStateRef.current = 'playing';
          lastTimeRef.current = performance.now();
          if (animationFrameRef.current == null) animationFrameRef.current = requestAnimationFrame(gameLoop);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameState === 'playing') {
      lastTimeRef.current = performance.now();
      if (animationFrameRef.current == null) {
        animationFrameRef.current = requestAnimationFrame(gameLoop);
      }
    } else {
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
    return () => {
    };
  }, [gameState]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const playerShoot = () => {
    if (gameStateRef.current !== 'playing') return;

    const pos = { ...playerRef.current };
    const newBullet: Bullet = {
      id: Date.now() + Math.random(),
      position: { x: pos.x, y: pos.y - 14 }, 
      type: 'player'
    };

    const updated = [...bulletsRef.current, newBullet];
    bulletsRef.current = updated;
    setBulletsState(updated);
  };

  const spawnEnemy = () => {
    const isBoss = Math.random() < 0.08;
    const newEnemy: Enemy = {
      id: Date.now() + Math.random(),
      position: { x: Math.random() * 320 + 40, y: 30 },
      type: isBoss ? 'boss' : 'normal',
      health: isBoss ? 3 : 1,
      isDiving: false,
      diveProgress: 0,
      diveTargetX: 0,
      direction: Math.random() > 0.5 ? 1 : -1
    };

    const updated = [...enemiesRef.current, newEnemy];
    enemiesRef.current = updated;
    setEnemiesState(updated);
  };

  const enemyShoot = () => {
    const enemiesNow = enemiesRef.current;
    if (enemiesNow.length === 0) return;

    const shooter = enemiesNow[Math.floor(Math.random() * enemiesNow.length)];
    const newBullet: Bullet = {
      id: Date.now() + Math.random(),
      position: { x: shooter.position.x, y: shooter.position.y + 12 },
      type: 'enemy'
    };

    const updated = [...bulletsRef.current, newBullet];
    bulletsRef.current = updated;
    setBulletsState(updated);
  };


  const playerHit = () => {
  
    const expl: Explosion = {
      id: Date.now() + Math.random(),
      position: { ...playerRef.current },
      progress: 0
    };
    const newExpl = [...explosionsRef.current, expl];
    explosionsRef.current = newExpl;
    setExplosionsState(newExpl);

    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
      
        setGameState('gameOver');
        gameStateRef.current = 'gameOver';
    
        if (animationFrameRef.current != null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return 0;
      }
      return newLives;
    });
  };


  const updateBullets = (delta: number) => {
    const updated = bulletsRef.current
      .map(b => {
        const dir = b.type === 'player' ? -1 : 1;
        return {
          ...b,
          position: { x: b.position.x, y: b.position.y + dir * BULLET_SPEED * delta }
        };
      })
      .filter(b => b.position.y > -30 && b.position.y < 430);
    bulletsRef.current = updated;
    setBulletsState(updated);
  };

  const updateEnemies = (delta: number) => {
    const updated = enemiesRef.current
      .map(enemy => {
        const copy = { ...enemy, position: { ...enemy.position } };

        if (enemy.isDiving) {
          const add = (ENEMY_DIVE_SPEED * delta) / 1000;
          copy.diveProgress = Math.min(1, enemy.diveProgress + add);

          const t = copy.diveProgress;
          const startX = enemy.position.x;
          const startY = enemy.position.y;
          const targetX = enemy.diveTargetX;

   
          const controlY = 180;
          copy.position.x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * targetX + t * t * targetX;
          copy.position.y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * 30;

          if (copy.diveProgress >= 1) {
            copy.isDiving = false;
            copy.diveProgress = 0;
            copy.position.y = 30;
            copy.position.x = copy.diveTargetX;
          }
        } else {
       
          copy.position.x += ENEMY_SPEED * delta * copy.direction;

         
          if (copy.position.x < 24) {
            copy.position.x = 24;
            copy.direction = 1;
          } else if (copy.position.x > 360) {
            copy.position.x = 360;
            copy.direction = -1;
          }

          if (Math.random() < 0.00025 * delta) {
            copy.isDiving = true;
            copy.diveProgress = 0;
            copy.diveTargetX = Math.random() * 320 + 40;
          }
        }

        if (copy.position.y > 358 && !copy.isDiving) {

          return null;
        }

        return copy;
      })
      .filter(Boolean) as Enemy[];

    const beforeLen = enemiesRef.current.length;
    const afterLen = updated.length;
    const removed = beforeLen - afterLen;
    if (removed > 0) {
      for (let i = 0; i < removed; i++) playerHit();
    }

    enemiesRef.current = updated;
    setEnemiesState(updated);
  };

  const updateExplosions = (delta: number) => {
    const updated = explosionsRef.current
      .map(ex => ({ ...ex, progress: ex.progress + delta / 800 })) // más lento para suavizar
      .filter(ex => ex.progress < 1);
    explosionsRef.current = updated;
    setExplosionsState(updated);
  };

  const checkCollisions = () => {

    let bulletsLocal = [...bulletsRef.current];
    let enemiesLocal = [...enemiesRef.current];
    const explosionsLocal: Explosion[] = [];

    for (let bi = bulletsLocal.length - 1; bi >= 0; bi--) {
      const b = bulletsLocal[bi];
      if (b.type !== 'player') continue;

      for (let ei = enemiesLocal.length - 1; ei >= 0; ei--) {
        const en = enemiesLocal[ei];
        const dx = Math.abs(b.position.x - en.position.x);
        const dy = Math.abs(b.position.y - en.position.y);
        if (dx < 18 && dy < 18) {
        
          bulletsLocal.splice(bi, 1);

          if (en.health <= 1) {
        
            explosionsLocal.push({
              id: Date.now() + Math.random(),
              position: { ...en.position },
              progress: 0
            });
            enemiesLocal.splice(ei, 1);
            setScore(prev => prev + (en.type === 'boss' ? 200 : 100));
          } else {
            enemiesLocal[ei] = { ...en, health: en.health - 1 };
          }
        }
      }
    }

    for (let bi = bulletsLocal.length - 1; bi >= 0; bi--) {
      const b = bulletsLocal[bi];
      if (b.type === 'enemy') {
        const dx = Math.abs(b.position.x - playerRef.current.x);
        const dy = Math.abs(b.position.y - playerRef.current.y);
        if (dx < 18 && dy < 18) {
          bulletsLocal.splice(bi, 1);
          playerHit();
        }
      }
    }

    bulletsRef.current = bulletsLocal;
    setBulletsState(bulletsLocal);

    enemiesRef.current = enemiesLocal;
    setEnemiesState(enemiesLocal);

    if (explosionsLocal.length > 0) {
      const newExpl = [...explosionsRef.current, ...explosionsLocal];
      explosionsRef.current = newExpl;
      setExplosionsState(newExpl);
    }
  };

  const gameLoop = (time: number) => {
    if (gameStateRef.current !== 'playing') {
      animationFrameRef.current = null;
      return;
    }

    const delta = time - lastTimeRef.current;
    lastTimeRef.current = time;

    if (keysPressed.current.has('ArrowLeft') || keysPressed.current.has('Left')) {
      const newX = Math.max(24, playerRef.current.x - PLAYER_SPEED * delta);
      playerRef.current = { ...playerRef.current, x: newX };
      setPlayerPositionState(playerRef.current);
    } else if (keysPressed.current.has('ArrowRight') || keysPressed.current.has('Right')) {
      const newX = Math.min(360, playerRef.current.x + PLAYER_SPEED * delta);
      playerRef.current = { ...playerRef.current, x: newX };
      setPlayerPositionState(playerRef.current);
    }

    enemySpawnTimer.current += delta;
    enemyShootTimer.current += delta;

    if (enemySpawnTimer.current > 7000) {
      spawnEnemy();
      enemySpawnTimer.current = 0;
    }

    if (enemyShootTimer.current > 2200 && enemiesRef.current.length > 0) {
      enemyShoot();
      enemyShootTimer.current = 0;
    }

    updateBullets(delta);
    updateEnemies(delta);
    updateExplosions(delta);
    checkCollisions();

    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };

  const togglePause = () => {
    if (gameStateRef.current === 'playing') {
      setGameState('paused');
      gameStateRef.current = 'paused';
    } else if (gameStateRef.current === 'paused') {
      setGameState('playing');
      gameStateRef.current = 'playing';
      lastTimeRef.current = performance.now();
      if (animationFrameRef.current == null) animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  };

  return (
    <Fragment>
      <div className='flex flex-col items-center justify-center bg-black min-h-screen text-white p-4'>
        <h1 className='text-4xl text-2p'>GALAGA GAME</h1>

        <div className='flex justify-between w-full max-w-md mb-4'>
          <div className='flex text-sm text-2p'>
            Points: <span className='text-2p'>{score}</span>
          </div>
          <div className='flex text-sm text-2p'>
            Level: <span>{level}</span>
          </div>
          <div className='flex text-sm text-2p'>
            Life: <span className='flex'>{'❤️'.repeat(lives)}</span>
          </div>
        </div>

        <div className='mb-2 text-xs text-2p text-gray-400'>
          Controls: Move with ← → | Shoot with SPACE | Pause with P
        </div>

        <div
          ref={gameAreaRef}
          className='relative w-full max-w-md h-96 bg-black border-2 border-purple-500 overflow-hidden rounded-lg'
          tabIndex={0}
        >
    
          {gameState !== 'gameOver' && lives > 0 && (
            <div
              aria-hidden
              className='absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 will-change-transform'
              style={{
                transform: `translate(${playerPositionState.x}px, ${playerPositionState.y}px)`,
                transition: 'transform 120ms ease-out'
              }}
            >
              <svg width='34' height='34' viewBox='0 0 30 30' className='text-blue-500' style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))' }}>
                <path d='M15 5 L5 25 L25 25 Z' fill='currentColor' />
              </svg>
            </div>
          )}

          {enemiesState.map(enemy => (
            <div
              key={enemy.id}
              aria-hidden
              className='absolute top-0 left-0 will-change-transform'
              style={{
                transform: `translate(${enemy.position.x}px, ${enemy.position.y}px)`,
                transition: 'transform 180ms linear'
              }}
            >
              {enemy.type === 'boss' ? (
                <svg width='3' height='34' viewBox='0 0 30 30' className='text-red-500' style={{ transform: 'translateY(-2px)' }}>
                  <circle cx='15' cy='15' r='12' fill='currentColor' />
                  <rect x='11' y='8' width='8' height='4' fill='black' />
                  <rect x='9' y='19' width='4' height='4' fill='black' />
                  <rect x='17' y='19' width='4' height='4' fill='black' />
                </svg>
              ) : (
                <svg width='28' height='28' viewBox='0 0 24 24' className='text-purple-500' style={{ transform: 'translateY(-2px)' }}>
                  <path d='M12 4 L4 20 L20 20 ' fill='currentColor' />
                </svg>
              )}

              {enemy.type === 'boss' && (
                <div className='absolute -bottom-2 left-0 w-full h-1 bg-gray-700 rounded'>
                  <div
                    className='h-full bg-green-500 transition-all duration-300 rounded'
                    style={{ width: `${(enemy.health / 3) * 100}%` }}
                  ></div>
                </div>
              )}
            </div>
          ))}

          {bulletsState.map(bullet => (
            <div
              key={bullet.id}
              aria-hidden
              className={`absolute top-0 left-0 w-2 h-4 rounded-full will-change-transform ${bullet.type === 'player' ? 'bg-yellow-400' : 'bg-red-500'}`}
              style={{
                transform: `translate(${bullet.position.x}px, ${bullet.position.y}px)`,
                transition: 'transform 80ms linear'
              }}
            />
          ))}

          {explosionsState.map(explosion => {
            const scale = 0.6 + explosion.progress * 1.6;
            const opacity = Math.max(0, 1 - explosion.progress);

            return (
              <div
                key={explosion.id}
                aria-hidden
                className='absolute top-0 left-0 rounded-full bg-orange-500 will-change-transform will-change-opacity'
                style={{
                  transform: `translate(${explosion.position.x}px, ${explosion.position.y}px) scale(${scale}) translate(-50%, -50%)`,
                  width: 18,
                  height: 18,
                  opacity,
                  boxShadow: '0 0 12px rgba(255,140,0,0.6)'
                }}
              />
            );
          })}

          {gameState !== 'playing' && (
            <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-70'>
              <div className='text-center p-6 rounded-lg'>
                {gameState === 'menu' && (
                  <>
                    <h2 className='text-2xl text-2p font-bold mb-4'>GALAGA GAME</h2>
                    <p className='mb-2 text-2p'>Use ← → Fdor Move</p>
                    <p className='mb-2 text-2p'>SPACE For Shoot</p>
                    <p className='mb-6 text-2p'>P For Pause</p>
                    <Button
                      color='success'
                      variant='ghost'
                      className='w-full text-2p'
                      onPress={initGame}
                    >
                      PLAY
                    </Button>
                  </>
                )}

                {gameState === 'paused' && (
                  <>
                    <h2 className='text-2xl text-2p'>SLOW</h2>
                    <Button
                      className='text-2p mx-2'
                      variant='shadow'
                      color='primary'
                      onPress={() => {
                        setGameState('playing');
                        gameStateRef.current = 'playing';
                        lastTimeRef.current = performance.now();
                        if (animationFrameRef.current == null) animationFrameRef.current = requestAnimationFrame(gameLoop);
                      }}
                    >
                      Continue
                    </Button>
                    <Button
                      className='text-2p mx-2'
                      color='danger'
                      variant='shadow'
                      onPress={initGame}
                    >
                      Restart
                    </Button>
                  </>
                )}

                {gameState === 'gameOver' && (
                  <>
                    <h2 className='text-2xl font-bold mb-2 text-2p text-red-500'>GAME OVER</h2>
                    <p className='mb-4 text-xs text-2p'>Puntuación: {score}</p>
                    <Button
                      className='text-2p'
                      color='secondary'
                      variant='shadow'
                      onPress={initGame}
                    >
                      PLAY AGAIN
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex space-x-4">
          {gameState === 'playing' && (
            <Button
              color='warning'
              variant='shadow'
              className='w-full text-2p'
              onPress={togglePause}
            >
              PAUSE
            </Button>
          )}

          {gameState === 'paused' && (
            <Button
              className='text-2p'
              color='success'
              variant='shadow'
              onPress={() => {
                setGameState('playing');
                gameStateRef.current = 'playing';
                lastTimeRef.current = performance.now();
                if (animationFrameRef.current == null) animationFrameRef.current = requestAnimationFrame(gameLoop);
              }}
            >
              Resume
            </Button>
          )}
        </div>
      </div>
    </Fragment>
  );
}
