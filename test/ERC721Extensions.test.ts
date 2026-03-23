const { ethers } = require("hardhat");
import { expect } from "chai";

describe("ERC20 extensions", function () {
  async function setup() {
    const [owner, user, user2, user3, user4] = await ethers.getSigners();

    const ExampleERC721 = await ethers.getContractFactory("ExampleERC721");
    let contract = await ExampleERC721.connect(owner).deploy("", "");

    return { owner, user, user2, user3, user4, contract };
  }

  it("Minter", async function () {
    const { contract, user, user2, user3, owner } = await setup();

    await owner.sendTransaction({
      to: user2.address,
      value: ethers.parseEther("3.0"),
    });

    await expect(contract.connect(owner).mint(user2.address)).to.emit(contract, "Transfer");
    expect(await contract.ownerOf(0)).to.eq(user2.address);
    expect(await contract.getMinter(0)).to.eq(user2.address);

    await contract.connect(user2).transferFrom(user2.address, user3.address, 0);
    expect(await contract.getMinter(0)).to.eq(user2.address);
  });

  it("ParentContracts", async function () {
    const { contract, user, user2, user3, owner } = await setup();

    // ExampleERC5169 supports IERC165 but returns false for IERC721 supportsInterface
    const ExampleERC5169Factory = await ethers.getContractFactory("ExampleERC5169");
    const nonErc721 = await ExampleERC5169Factory.connect(owner).deploy();
    await expect(contract.connect(owner).addParent(nonErc721.target)).to.revertedWith("Must be ERC721 contract");
    await expect(contract.connect(user2).addParent(nonErc721.target)).to.revertedWith('OwnableUnauthorizedAccount("'+user2.address+'")');

    // Deploy another ExampleERC721 which properly supports IERC721
    const ExampleERC721Factory = await ethers.getContractFactory("ExampleERC721");
    const realErc721 = await ExampleERC721Factory.connect(owner).deploy("test", "TST");
    await expect(contract.connect(owner).addParent(realErc721.target)).to.emit(contract, "ParentAdded");

    expect(await contract.getParents()).to.eql([realErc721.target]);
  });

  it("Enumerable", async function () {
    const { contract, user, user2, user3, owner } = await setup();

    await expect(contract.connect(owner).mint(user2.address)).to.emit(contract, "Transfer");

    expect(await contract.balanceOf(user2.address)).to.eq(1);
    expect(await contract.totalSupply()).to.eq(1);
    expect(await contract.tokenByIndex(0)).to.eq(0);
    expect(await contract.tokenOfOwnerByIndex(user2.address, 0)).to.eq(0);
  });

  it("Enumerable + Burn", async function () {
    const { contract, user, user2, user3, owner } = await setup();

    await expect(contract.connect(owner).mint(user2.address)).to.emit(contract, "Transfer");
    await expect(contract.connect(owner).mint(user2.address)).to.emit(contract, "Transfer");
    await expect(contract.connect(owner).mint(user3.address)).to.emit(contract, "Transfer");
    await expect(contract.connect(owner).mint(user2.address)).to.emit(contract, "Transfer");
    await expect(contract.connect(user2).burn(1)).to.emit(contract, "Transfer");

    expect(await contract.balanceOf(user2.address)).to.eq(2);
    expect(await contract.totalSupply()).to.eq(3);
    expect(await contract.tokenByIndex(1)).to.eq(2);
    expect(await contract.tokenOfOwnerByIndex(user2.address, 1)).to.eq(3);
  });

  it("ERC721 supportInterface", async function () {
    const { contract, user, user2, user3, owner } = await setup();

    const ERC721InterfaceId = "0x80ac58cd";
    expect(await contract.supportsInterface(ERC721InterfaceId)).to.eq(true);
  });

  it("SharedHolders", async function () {
    const { contract, user, user2, user3, owner } = await setup();

    await expect(contract.connect(owner).mint(user3.address)).to.emit(contract, "Transfer");

    expect(await contract.isSharedHolderTokenOwner(contract.target, 0)).to.eq(false);

    await expect(contract.connect(owner).setSharedTokenHolders([user2.address])).to.emit(contract, "SharedTokenHoldersUpdated");

    expect(await contract.isSharedHolderTokenOwner(contract.target, 0)).to.eq(false);

    await expect(contract.connect(owner).setSharedTokenHolders([user2.address, user3.address])).to.emit(contract, "SharedTokenHoldersUpdated");

    expect(await contract.isSharedHolderTokenOwner(contract.target, 0)).to.eq(true);
  });

  it("set royalty info", async function () {
    const { contract, user, user2, user3, owner } = await setup();

    await expect(contract.connect(owner).mint(user.address)).to.emit(contract, "Transfer");

    await expect(contract.connect(user).setRoyaltyPercentage(800)).to.revertedWith('OwnableUnauthorizedAccount("'+user.address+'")');

    await expect(contract.connect(owner).setRoyaltyPercentage(800)).to.emit(contract, "RoyaltyUpdated");

    await expect(contract.connect(user).setRoyaltyContract(user.address)).to.revertedWith('OwnableUnauthorizedAccount("'+user.address+'")');

    await expect(contract.connect(owner).setRoyaltyContract(user.address)).to.emit(contract, "RoyaltyContractUpdated");

    let royaltyValue = await contract.royaltyInfo(0, 10000);
    expect(royaltyValue.receiver).to.eq(user.address);
    expect(royaltyValue.royaltyAmount).to.eq(800);
  });
});
