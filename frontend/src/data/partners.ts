import moest from '@/assets/partners/moest.svg'
import costech from '@/assets/partners/costech.png'
import tcu from '@/assets/partners/tcu.png'
import esrf from '@/assets/partners/esrf.jpg'
import repoa from '@/assets/partners/repoa.png'
import unesco from '@/assets/partners/unesco.svg'
import undp from '@/assets/partners/undp.svg'
import au from '@/assets/partners/au.webp'
import afdb from '@/assets/partners/afdb.svg'
import mcf from '@/assets/partners/mcf.jpg'
import idrc from '@/assets/partners/idrc.svg'
import daad from '@/assets/partners/daad.svg'
import britishCouncil from '@/assets/partners/british-council.svg'
import worldBank from '@/assets/partners/world-bank.svg'

export interface CoalitionPartner {
  name: string
  /** Official mark from the organisation's site or its published emblem. */
  logo?: string
}

export const COALITION_INTRO =
  'YRIF is building a coalition of national and international partners spanning government, academia, the private sector, and multilateral and philanthropic institutions.'

export const NATIONAL_PARTNERS: CoalitionPartner[] = [
  { name: 'Ministry of Education, Science and Technology (MOEST)', logo: moest },
  { name: 'Tanzania Commission for Science and Technology (COSTECH)', logo: costech },
  { name: 'Tanzania Commission for Universities (TCU)', logo: tcu },
  { name: 'ESRF', logo: esrf },
  { name: 'REPOA', logo: repoa },
]

export const NATIONAL_PARTNER_GROUPS = [
  'Public and private universities',
  'Regional government administration',
  'Private-sector sponsors',
]

export const INTERNATIONAL_PARTNERS: CoalitionPartner[] = [
  { name: 'UNESCO', logo: unesco },
  { name: 'UNDP Tanzania', logo: undp },
  { name: 'African Union', logo: au },
  { name: 'African Development Bank', logo: afdb },
  { name: 'Mastercard Foundation', logo: mcf },
  { name: 'IDRC', logo: idrc },
  { name: 'DAAD', logo: daad },
  { name: 'British Council', logo: britishCouncil },
  { name: 'World Bank Group', logo: worldBank },
]

export const ALL_NAMED_PARTNERS: CoalitionPartner[] = [
  ...NATIONAL_PARTNERS,
  ...INTERNATIONAL_PARTNERS,
]
