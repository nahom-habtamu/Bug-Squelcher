-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('P0', 'P1', 'P2', 'P3');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('Open', 'InProgress', 'WorksOnMyMachine');

-- CreateTable
CREATE TABLE "Bug" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "stepsToReproduce" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'Open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bug_pkey" PRIMARY KEY ("id")
);
