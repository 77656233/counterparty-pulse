<template>
  <div v-if="show" class="modal modal-open">
    <div class="modal-box bg-base-100 max-w-4xl">
      <h3 class="font-bold text-lg mb-4">Understanding Asset Cards</h3>
      
      <div class="space-y-6 max-h-96 overflow-y-auto">
        <!-- Asset Name & Symbol -->
        <div class="border-l-4 border-blue-500 pl-4">
          <h4 class="font-semibold text-blue-600 mb-2">Asset Name & Symbol</h4>
          <p class="text-sm opacity-70">
            The <strong>Asset Name</strong> is the unique identifier for the digital asset on the Counterparty platform. 
            The <strong>Symbol</strong> is a short abbreviation that represents the asset.
          </p>
        </div>
        
        <!-- Supply -->
        <div class="border-l-4 border-green-500 pl-4">
          <h4 class="font-semibold text-green-600 mb-2">Supply (Total Amount)</h4>
          <p class="text-sm opacity-70">
            The <strong>Supply</strong> shows the total number of available tokens for this asset. 
            This can be a fixed amount or may change through additional issuances.
          </p>
        </div>
        
        <!-- Issuances (Total Created) -->
        <div class="border-l-4 border-cyan-500 pl-4">
          <h4 class="font-semibold text-cyan-600 mb-2">Issuances (Total Created)</h4>
          <p class="text-sm opacity-70">
            The total amount of tokens that have been <strong>created/issued</strong> for this asset.
            This is the original amount before any burns or destructions.
          </p>
        </div>
        
        <!-- Burns -->
        <div class="border-l-4 border-red-500 pl-4">
          <h4 class="font-semibold text-red-600 mb-2">Burns</h4>
          <p class="text-sm opacity-70">
            The total amount of tokens that have been <strong>permanently destroyed</strong> (burned).
            Burned tokens are removed from circulation forever.
          </p>
        </div>
        
        <!-- Address Burns -->
        <div class="border-l-4 border-pink-500 pl-4">
          <h4 class="font-semibold text-pink-600 mb-2">Address Burns</h4>
          <p class="text-sm opacity-70">
            Tokens sent to <strong>burn addresses</strong> (unspendable addresses) that effectively 
            remove them from circulation without formal burn transactions.
          </p>
        </div>
        
        <!-- Available Supply -->
        <div class="border-l-4 border-emerald-500 pl-4">
          <h4 class="font-semibold text-emerald-600 mb-2">Available Supply</h4>
          <p class="text-sm opacity-70">
            The actual <strong>circulating supply</strong> available for trading.
            Calculated as: Issuances - Burns - Address Burns.
          </p>
        </div>
        
        <!-- Holders -->
        <div class="border-l-4 border-purple-500 pl-4">
          <h4 class="font-semibold text-purple-600 mb-2">Holders (Owners)</h4>
          <p class="text-sm opacity-70">
            The number of <strong>Holders</strong> indicates how many different addresses/wallets 
            currently own this asset. A higher number suggests broader distribution.
          </p>
        </div>
        
        <!-- Marketplace Offers -->
        <div class="border-l-4 border-red-500 pl-4">
          <h4 class="font-semibold text-red-600 mb-2">Marketplace Offers</h4>
          <p class="text-sm opacity-70">
            The number of active <strong>trading offers</strong> for this asset on 
            decentralized exchanges and marketplaces.
          </p>
        </div>
        
        <!-- Description -->
        <div class="border-l-4 border-indigo-500 pl-4">
          <h4 class="font-semibold text-indigo-600 mb-2">Description</h4>
          <p class="text-sm opacity-70">
            The <strong>Description</strong> contains additional information about the asset 
            provided by the creator. This may include links to websites, 
            project descriptions, or other relevant details.
          </p>
        </div>
        
        <!-- Additional Info -->
        <div class="bg-base-200 p-4 rounded-lg">
          <h4 class="font-semibold mb-2">💡 Additional Information</h4>
          <ul class="text-sm opacity-70 space-y-1">
            <li>• <strong>Locked:</strong> Indicates if the asset is locked against further issuances</li>
            <li>• <strong>Divisible:</strong> Shows if the asset can be divided into fractions</li>
            <li>• <strong>Creation Date:</strong> The date when the asset was created</li>
            <li>• <strong>Chain:</strong> Shows which blockchain variant the asset exists on (Classic or Counterparty)</li>
          </ul>
        </div>
      </div>
    </div>
    <div class="modal-backdrop" @click="$emit('close')"></div>
  </div>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    required: true
  }
});

defineEmits(['close']);
</script>