export const Abilities: {[abilityid: string]: ModdedAbilityData} = {
	fiendish: {
		onBasePowerPriority: 21,
		onBasePower(basePower, attacker, defender, move) {
			if (move.flags['statusm']) {
				return this.chainModify([0x14CD, 0x1000]);
			}
		},
		name: "Fiendish",
		desc: "This Pokemon's attacks that can apply status conditions have their power multiplied by 1.3.",
		shortDesc: "This Pokemon's attacks that apply status conditions have 1.3x power.",
		rating: 3,
		num: 269,
	},
	heavyair: {
		onModifyPriority(priority, pokemon, target, move) {
			if (move.type === 'Flying') return priority - 6;
		},
		onModifyMove(move) {
			if (move.type === 'Flying') delete move.flags['protect'];
		},
		onModifyDamage(damage, source, target, move) {
			if (target.getMoveHitData(move).typeMod < 0) {
				if (move.type === 'Flying') {
					this.debug('Heavy Air boost');
					return this.chainModify(2);
				}
			}
		},
		name: "Heavy Air",
		desc: "This Pokemon's Flying-type attacks that are not very effective on a target deal double damage, cannot be protected, and always move last.",
		shortDesc: "Flying-type attacks deal 2x dmg against resistances, can't be protected, and move last.",
		rating: 3.5,
		num: 271,
	},
	herculean: {
		onBasePowerPriority: 30,
		onBasePower(basePower, attacker, defender, move) {
			const basePowerAfterMultiplier = this.modify(basePower, this.event.modifier);
			this.debug('Base Power: ' + basePowerAfterMultiplier);
			if (basePowerAfterMultiplier >= 100) {
				this.debug('Herculean boost');
				return this.chainModify([0x1333, 0x1000]);
			}
		},
		name: "Herculean",
		desc: "This Pokemon's moves of 100 power or more have their power multiplied by 1.2.",
		shortDesc: "This Pokemon's moves of 100 power or more have 1.2x power.",
		rating: 3.5,
		num: 268,
	},
	sundancer: {
		onAfterMove(source, target, move) {
			if (move.flags['dance']) {
				if (this.field.getWeather().id !== 'sunnyday') {
					this.field.setWeather('sunnyday');
				}
			}
		},
		name: "Sundancer",
		shortDesc: "When this Pokemon successfully uses a Dance move, Sunny Day begins.",
		rating: 3,
		num: 270,
	},
	nefarious: {
		onResidualOrder: 26,
		onResidualSubOrder: 1,
		onResidual(pokemon) {
			for (const target of pokemon.side.foe.active) {
				this.damage(target.baseMaxhp / 8, target, pokemon);
			}
			this.damage(pokemon.baseMaxhp / 8);
		},
		name: "Nefarious",
		rating: 3.5,
		num: 1000,
		shortDesc: "Both Pokemon lose 1/8 of their max HP each turn.",
	},
	copperheart: {
		onAnyModifyDamage(damage, source, target, move) {
			return this.chainModify(0.60);
		},
		name: "Copper Heart",
		rating: 3.5,
		num: 1001,
		shortDesc: "Damage taken from attacks is reduced by 40%.",
	},
	burrower: {
		onPrepareHit(source, target, move) {
			if (move.type === 'Ground') {
				this.heal(source.baseMaxhp / 8);
			}
		},
		name: "Burrower",
		rating: 4,
		num: 90,
		shortDesc: "Heal 1/8 of max HP when using a Ground-type move.",
	},
	foreigngas: {
		onStart(source) {
			this.field.setWeather('vacuum');
		},
		name: "Foreign Gas",
		rating: 4,
		num: 1003,
	},
	invader: {
		onStart(pokemon) {
			let statName = 'atk';
			let bestStat = 0;
			let s: StatNameExceptHP;
			for (s in source.storedStats) {
				if (source.storedStats[s] > bestStat) {
					statName = s;
					bestStat = source.storedStats[s];
				}
			}
			this.boost({[statName]: length}, source);
		},
		onResidualOrder: 26,
		onResidualSubOrder: 1,
		onResidual(pokemon) { //should stay if vacuum weather is active
			if (pokemon.activeTurns) {
				let statName = 'atk';
				let bestStat = 0;
				let s: StatNameExceptHP;
				this.boost({s: -1});
			}
		},
		name: "Invader",
		rating: 4,
		num: 1004,
	},
};
