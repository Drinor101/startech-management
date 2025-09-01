import express from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Merr të gjithë përdoruesit (vetëm admin)
router.get('/', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data,
      count: data.length
    });
  } catch (error) {
    console.error('Gabim në marrjen e përdoruesve:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e përdoruesve'
    });
  }
});

// Merr një përdorues specifik
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    // Përdoruesi mund të shohë vetëm profilin e vet, përveç nëse është admin
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Nuk keni leje për të parë këtë profil'
      });
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Përdoruesi nuk u gjet'
      });
    }

    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Gabim në marrjen e përdoruesit:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në marrjen e përdoruesit'
    });
  }
});

// Përditëson një përdorues
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Përdoruesi mund të përditësojë vetëm profilin e vet, përveç nëse është admin
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Nuk keni leje për të përditësuar këtë profil'
      });
    }

    // Heq fushët që nuk duhet të përditësohen
    delete updates.id;
    delete updates.created_at;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data,
      message: 'Përdoruesi u përditësua me sukses'
    });
  } catch (error) {
    console.error('Gabim në përditësimin e përdoruesit:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në përditësimin e përdoruesit'
    });
  }
});

// Fshin një përdorues (vetëm admin)
router.delete('/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Nuk lejohet fshirja e vetes
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        error: 'Nuk mund të fshini vetë profilin tuaj'
      });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Përdoruesi u fshi me sukses'
    });
  } catch (error) {
    console.error('Gabim në fshirjen e përdoruesit:', error);
    res.status(500).json({
      success: false,
      error: 'Gabim në fshirjen e përdoruesit'
    });
  }
});

export default router;

