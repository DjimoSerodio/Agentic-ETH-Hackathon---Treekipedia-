"use client";

import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Network, Alchemy } from "alchemy-sdk";
import { useEffect, useState } from "react";
import Image from "next/image";

const NFT_CONTRACT_ADDRESS = "0x5Ed6240fCC0B2A231887024321Cc9481ba07f3c6";

// Configure Alchemy SDK
const alchemy = new Alchemy({
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
  network: Network.BASE_SEPOLIA,
});

// NFT Card Component

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NFTCard({ nft }: { nft: any }) {

    console.log("nft", nft);
  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="relative w-full h-48">
        {nft.image ? (
          <Image
            src={nft.image}
            alt={nft.title || "NFT"}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            No Image
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">
          {nft.title || `Token ID: ${nft.tokenId}`}
        </h3>
        {nft.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{nft.description}</p>
        )}
        <div className="mt-2 text-sm text-black">
          Quantity: {nft.balance}
        </div>
      </div>
    </div>
  );
}

export default function NFTsPage() {
  const { address } = useAccount();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  console.log("nfts", nfts);

  useEffect(() => {
    async function fetchNFTs() {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        const response = await alchemy.nft.getNftsForOwner(
            address,
            {
              contractAddresses: [NFT_CONTRACT_ADDRESS],
              omitMetadata: false,
            }
          );

        // Transform the NFT data
        const nftData = await Promise.all(
          response.ownedNfts.map(async (nft) => {
            const metadata = nft?.raw.metadata;
            let image = metadata?.image || '';
            
            if (image.startsWith('ipfs://')) {
              image = image.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }

            return {
              tokenId: nft.tokenId,
              title: metadata?.name || `NFT #${nft.tokenId}`,
              description: metadata?.description,
              image: image,
              // Add balance information since ERC1155 tokens can have multiple copies
              balance: nft.balance,
            };
          })
        );

        console.log("Fetched NFT data:", nftData);
        setNfts(nftData);
      } catch (error) {
        console.error("Error fetching NFTs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchNFTs();
  }, [address]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col space-y-2 items-center justify-center gap-2">
            <Loader2 className="w-10 h-10 animate-spin text-green-500" />
            Loading NFTs...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Species
          </Button>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h1 className="text-2xl font-bold mb-6">Your Research NFTs</h1>
          
          {!address ? (
            <div className="text-center py-8">
              Please connect your wallet to view NFTs
            </div>
          ) : nfts.length === 0 ? (
            <div className="text-center py-8">
              No Research NFTs found in your wallet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nfts.map((nft) => (
                <NFTCard key={nft.tokenId} nft={nft} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
