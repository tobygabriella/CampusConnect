import express from 'express';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import dotenv from 'dotenv';
import { requireAuth } from "../middleware/authMiddleware.js"; 


dotenv.config();
const router = express.Router();
const prisma = new PrismaClient();


router.get('/search',  async (req, res) => {
  const { query = '' } = req.query;
  
  if (!query || query.length < 2) {
    return res.json({ colleges: [] });
  }

  try {
    // Search our local database (MA colleges)
    const localColleges = await prisma.college.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { city: { contains: query, mode: 'insensitive' } },
            ]
          },
          { state: 'MA' }
        ]
      },
      take: 10,
      orderBy: {
        name: 'asc',
      },
    });

    // If we found results locally, return them
    if (localColleges.length > 0) {
      return res.json({ 
        colleges: localColleges, 
        source: 'local' 
      });
    }

    // If no local results, search the API for MA colleges
    const response = await axios.get(
      'https://api.data.gov/ed/collegescorecard/v1/schools',
      {
        params: {
          api_key: process.env.EDUCATION_API_KEY,
          'school.name': query,
          'school.state': 'MA',
          'school.operating': 1,
          fields: 'school.name,school.state,school.city,id',
          per_page: 10,
        },
      }
    );

    const apiColleges = response.data.results
      .filter(college => 
        college['school.name'] && 
        college['school.state'] && 
        college['school.city']
      )
      .map(college => ({
        name: college['school.name'],
        state: college['school.state'],
        city: college['school.city'],
        originalId: college.id.toString(),
      }));

    // If we found new colleges from the API, add them to our database
    if (apiColleges.length > 0) {
      await prisma.college.createMany({
        data: apiColleges,
        skipDuplicates: true,
      });
    }

    res.json({ 
      colleges: apiColleges, 
      source: 'api' 
    });

  } catch (error) {
    console.error('Search error:', error);
    // If API fails, return whatever we found locally
    const localColleges = await prisma.college.findMany({
      where: {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { city: { contains: query, mode: 'insensitive' } },
            ]
          },
          { state: 'MA' }
        ]
      },
      take: 10,
    });
    res.json({ 
      colleges: localColleges, 
      source: 'local_fallback' 
    });
  }
});

router.get('/details', async (req, res) => {
    const { ids } = req.query;
    
    if (!ids) {
      return res.json({ colleges: [] });
    }
  
    const collegeIds = ids.split(',');
  
    try {
      const colleges = await prisma.college.findMany({
        where: {
          id: {
            in: collegeIds
          }
        }
      });
  
      res.json({ colleges });
    } catch (error) {
      console.error('Error fetching college details:', error);
      res.status(500).json({ message: 'Error fetching college details' });
    }
  });

export default router;