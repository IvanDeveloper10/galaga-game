'use client';

import { Fragment } from 'react';
import Image from 'next/image';
import { Button } from '@heroui/button';
import Link from 'next/link';
import { Drawer, DrawerContent, DrawerHeader, DrawerBody } from '@heroui/drawer';
import { useDisclosure } from '@heroui/modal';

export default function HomePage(): JSX.Element {

  const { isOpen, onOpen, onOpenChange }: any = useDisclosure();

  return (
    <Fragment>
      <section className='container-home w-full h-screen flex'>
        <main className='w-2/4 flex flex-col justify-center items-center bg-black p-5'>
          <h1 className='text-2p text-4xl mt-10'>WELCOME TO</h1>
          <h1 className='text-2p text-8xl text-shadow-white text-shadow-lg'>GALAGA</h1>
          <div className='w-full flex justify-around flex-wrap items-center mt-5 gap-5'>
            <Button onPress={onOpen} className='text-2p w-56' color='secondary' variant='shadow'>CHOOSE A LEVEL</Button>
            <Link href={'/Levels/LevelOne'}>
              <Button className='text-2p w-52' color='success' variant='shadow'>GO TO PLAY</Button>
            </Link>
      
            <Button className='text-2p' color='danger' variant='shadow' isDisabled>PLAY ONLINE</Button>
          </div>
        </main>
        <div className='w-2/4 h-screen flex justify-center items-center'>
          <Image src={'/game-retro-image.png'} alt={'Image Game Retro'} width={400} height={400}></Image>
        </div>
      </section>
      <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className='flex justify-center items-center'>
            <h1 className='text-2p'>LEVELS</h1>
          </DrawerHeader>
          <DrawerBody>
            <Link href={'/Levels/LevelOne'}>
              <span className='text-2p'>Level One</span>
            </Link>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      <section className='w-full h-screen bg-white rounded-4xl flex justify-center items-center'>
        <Image src={'/background-image.jpg'} alt={''} width={1000} height={600}></Image>
      </section>
    </Fragment>
  );
}